from django.db.models import Sum
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes
from datetime import datetime

from purchases.models import Purchase
from transfers.models import Transfer
from assignments.models import Assignment
from expenditures.models import Expenditure
from .serializers import DashboardSerializer


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="base",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description="Filter dashboard by Base ID",
                required=False,
            ),
            OpenApiParameter(
                name="equipment_type",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description="Filter dashboard by Equipment Type ID",
                required=False,
            ),
            OpenApiParameter(
                name="start_date",
                type=OpenApiTypes.DATE,
                location=OpenApiParameter.QUERY,
                description="Start date in YYYY-MM-DD format",
                required=False,
            ),
            OpenApiParameter(
                name="end_date",
                type=OpenApiTypes.DATE,
                location=OpenApiParameter.QUERY,
                description="End date in YYYY-MM-DD format",
                required=False,
            ),
        ]
    )
    def get(self, request):

        # ---------------------------------------------------------
        # Read query parameters
        # ---------------------------------------------------------

        base_id = request.query_params.get("base")
        equipment_type_id = request.query_params.get("equipment_type")

        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        # ---------------------------------------------------------
        # Validate start_date
        # ---------------------------------------------------------

        if start_date:
            try:
                start_date = datetime.strptime(
                    start_date,
                    "%Y-%m-%d"
                ).date()

            except ValueError:
                return Response(
                    {
                        "detail": "Invalid start_date. Use YYYY-MM-DD format."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # ---------------------------------------------------------
        # Validate end_date
        # ---------------------------------------------------------

        if end_date:
            try:
                end_date = datetime.strptime(
                    end_date,
                    "%Y-%m-%d"
                ).date()

            except ValueError:
                return Response(
                    {
                        "detail": "Invalid end_date. Use YYYY-MM-DD format."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # ---------------------------------------------------------
        # Validate date range
        # ---------------------------------------------------------

        if start_date and end_date and start_date > end_date:
            return Response(
                {
                    "detail": "start_date cannot be later than end_date."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ---------------------------------------------------------
        # Commander restriction
        # ---------------------------------------------------------

        user = request.user

        if user.role == "COMMANDER":
            if not user.assigned_base_id:
                return Response(
                    {
                        "detail": "Commander is not assigned to a base."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            base_id = user.assigned_base_id

        # ---------------------------------------------------------
        # Base filters
        # ---------------------------------------------------------

        purchase_filter = {}

        transfer_in_filter = {
            "status": "COMPLETED"
        }

        transfer_out_filter = {
            "status": "COMPLETED"
        }

        assignment_filter = {}

        expenditure_filter = {}

        if base_id:
            purchase_filter["base_id"] = base_id
            transfer_in_filter["to_base_id"] = base_id
            transfer_out_filter["from_base_id"] = base_id
            assignment_filter["base_id"] = base_id
            expenditure_filter["base_id"] = base_id

        if equipment_type_id:
            purchase_filter["equipment_type_id"] = equipment_type_id
            transfer_in_filter["equipment_type_id"] = equipment_type_id
            transfer_out_filter["equipment_type_id"] = equipment_type_id
            assignment_filter["equipment_type_id"] = equipment_type_id
            expenditure_filter["equipment_type_id"] = equipment_type_id

        # ---------------------------------------------------------
        # Opening Balance
        # ---------------------------------------------------------

        opening_balance = 0

        if start_date:

            opening_purchase = (
                Purchase.objects
                .filter(
                    purchase_date__lt=start_date,
                    **purchase_filter
                )
                .aggregate(total=Sum("quantity"))["total"]
                or 0
            )

            opening_transfer_in = (
                Transfer.objects
                .filter(
                    transfer_date__date__lt=start_date,
                    **transfer_in_filter
                )
                .aggregate(total=Sum("quantity"))["total"]
                or 0
            )

            opening_transfer_out = (
                Transfer.objects
                .filter(
                    transfer_date__date__lt=start_date,
                    **transfer_out_filter
                )
                .aggregate(total=Sum("quantity"))["total"]
                or 0
            )

            opening_expenditure = (
                Expenditure.objects
                .filter(
                    expenditure_date__date__lt=start_date,
                    **expenditure_filter
                )
                .aggregate(total=Sum("quantity"))["total"]
                or 0
            )

            opening_balance = (
                opening_purchase
                + opening_transfer_in
                - opening_transfer_out
                - opening_expenditure
            )

        # ---------------------------------------------------------
        # Current Period Filters
        # ---------------------------------------------------------

        purchase_queryset = Purchase.objects.filter(
            **purchase_filter
        )

        transfer_in_queryset = Transfer.objects.filter(
            **transfer_in_filter
        )

        transfer_out_queryset = Transfer.objects.filter(
            **transfer_out_filter
        )

        assignment_queryset = Assignment.objects.filter(
            **assignment_filter
        )

        expenditure_queryset = Expenditure.objects.filter(
            **expenditure_filter
        )

        # ---------------------------------------------------------
        # Apply Start Date
        # ---------------------------------------------------------

        if start_date:

            purchase_queryset = purchase_queryset.filter(
                purchase_date__gte=start_date
            )

            transfer_in_queryset = transfer_in_queryset.filter(
                transfer_date__date__gte=start_date
            )

            transfer_out_queryset = transfer_out_queryset.filter(
                transfer_date__date__gte=start_date
            )

            assignment_queryset = assignment_queryset.filter(
                assigned_date__date__gte=start_date
            )

            expenditure_queryset = expenditure_queryset.filter(
                expenditure_date__date__gte=start_date
            )

        # ---------------------------------------------------------
        # Apply End Date
        # ---------------------------------------------------------

        if end_date:

            purchase_queryset = purchase_queryset.filter(
                purchase_date__lte=end_date
            )

            transfer_in_queryset = transfer_in_queryset.filter(
                transfer_date__date__lte=end_date
            )

            transfer_out_queryset = transfer_out_queryset.filter(
                transfer_date__date__lte=end_date
            )

            assignment_queryset = assignment_queryset.filter(
                assigned_date__date__lte=end_date
            )

            expenditure_queryset = expenditure_queryset.filter(
                expenditure_date__date__lte=end_date
            )

        # ---------------------------------------------------------
        # Calculate Dashboard Metrics
        # ---------------------------------------------------------

        purchases = (
            purchase_queryset
            .aggregate(total=Sum("quantity"))["total"]
            or 0
        )

        transfer_in = (
            transfer_in_queryset
            .aggregate(total=Sum("quantity"))["total"]
            or 0
        )

        transfer_out = (
            transfer_out_queryset
            .aggregate(total=Sum("quantity"))["total"]
            or 0
        )

        assigned = (
            assignment_queryset
            .aggregate(total=Sum("quantity"))["total"]
            or 0
        )

        expended = (
            expenditure_queryset
            .aggregate(total=Sum("quantity"))["total"]
            or 0
        )

        # ---------------------------------------------------------
        # Net Movement
        # ---------------------------------------------------------

        net_movement = (
            purchases
            + transfer_in
            - transfer_out
        )

        # ---------------------------------------------------------
        # Closing Balance
        # ---------------------------------------------------------

        closing_balance = (
            opening_balance
            + net_movement
            - expended
        )

        # ---------------------------------------------------------
        # Response
        # ---------------------------------------------------------

        data = {
            "opening_balance": opening_balance,
            "purchases": purchases,
            "transfer_in": transfer_in,
            "transfer_out": transfer_out,
            "net_movement": net_movement,
            "assigned": assigned,
            "expended": expended,
            "closing_balance": closing_balance,
        }

        serializer = DashboardSerializer(data)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )
from rest_framework import serializers


class DashboardSerializer(serializers.Serializer):
    opening_balance = serializers.IntegerField()
    purchases = serializers.IntegerField()
    transfer_in = serializers.IntegerField()
    transfer_out = serializers.IntegerField()
    net_movement = serializers.IntegerField()
    assigned = serializers.IntegerField()
    expended = serializers.IntegerField()
    closing_balance = serializers.IntegerField()
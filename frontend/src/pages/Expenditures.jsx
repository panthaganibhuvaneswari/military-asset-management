import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  X,
  ReceiptText,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Expenditures() {
  const { user } = useAuth();

  const [expenditures, setExpenditures] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipment, setEquipment] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingExpenditure, setEditingExpenditure] =
    useState(null);

  const [formData, setFormData] = useState({
    base: "",
    equipment_type: "",
    quantity: "",
    reason: "",
    expenditure_date: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isAdmin = user?.role === "ADMIN";
  const isCommander = user?.role === "COMMANDER";

  // --------------------------------------------------
  // LOAD DATA
  // --------------------------------------------------

  const loadExpenditures = async () => {
    try {
      const response = await api.get("expenditures/");
      setExpenditures(response.data);
    } catch (error) {
      console.error(
        "Error loading expenditures:",
        error
      );

      setError(
        error.response?.data?.detail ||
          "Unable to load expenditure records."
      );
    }
  };

  const loadBases = async () => {
    try {
      const response = await api.get("bases/");
      setBases(response.data);
    } catch (error) {
      console.error("Error loading bases:", error);
    }
  };

  const loadEquipment = async () => {
    try {
      const response = await api.get("equipment/");
      setEquipment(response.data);
    } catch (error) {
      console.error(
        "Error loading equipment:",
        error
      );
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    setError("");

    try {
      await Promise.all([
        loadExpenditures(),
        loadBases(),
        loadEquipment(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // --------------------------------------------------
  // REFRESH
  // --------------------------------------------------

  const handleRefresh = async () => {
    setRefreshing(true);
    setError("");

    try {
      await Promise.all([
        loadExpenditures(),
        loadBases(),
        loadEquipment(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------

  const filteredExpenditures = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return expenditures;
    }

    return expenditures.filter((expenditure) => {
      return (
        String(expenditure.id)
          .toLowerCase()
          .includes(search) ||
        String(expenditure.base_name || "")
          .toLowerCase()
          .includes(search) ||
        String(expenditure.equipment_name || "")
          .toLowerCase()
          .includes(search) ||
        String(expenditure.quantity || "")
          .toLowerCase()
          .includes(search) ||
        String(expenditure.reason || "")
          .toLowerCase()
          .includes(search) ||
        String(expenditure.recorded_by_username || "")
          .toLowerCase()
          .includes(search)
      );
    });
  }, [expenditures, searchTerm]);

  // --------------------------------------------------
  // MODAL
  // --------------------------------------------------

  const openAddModal = () => {
    setEditingExpenditure(null);

    setFormData({
      base: isCommander
        ? user?.base_id || ""
        : "",
      equipment_type: "",
      quantity: "",
      reason: "",
      expenditure_date: getCurrentDateTime(),
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (expenditure) => {
    setEditingExpenditure(expenditure);

    setFormData({
      base: expenditure.base || "",
      equipment_type:
        expenditure.equipment_type || "",
      quantity: expenditure.quantity || "",
      reason: expenditure.reason || "",
      expenditure_date: formatDateTimeForInput(
        expenditure.expenditure_date
      ),
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingExpenditure(null);

    setFormData({
      base: "",
      equipment_type: "",
      quantity: "",
      reason: "",
      expenditure_date: "",
    });

    setError("");
    setSuccess("");
  };

  // --------------------------------------------------
  // FORM
  // --------------------------------------------------

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // --------------------------------------------------
  // SAVE
  // --------------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!formData.base) {
      setError("Please select a base.");
      return;
    }

    if (!formData.equipment_type) {
      setError("Please select an equipment type.");
      return;
    }

    if (
      !formData.quantity ||
      Number(formData.quantity) <= 0
    ) {
      setError("Quantity must be greater than zero.");
      return;
    }

    if (!formData.reason.trim()) {
      setError("Please enter the reason.");
      return;
    }

    if (!formData.expenditure_date) {
      setError("Please select expenditure date.");
      return;
    }

    try {
      const payload = {
        base: Number(formData.base),
        equipment_type: Number(
          formData.equipment_type
        ),
        quantity: Number(formData.quantity),
        reason: formData.reason.trim(),
        expenditure_date: new Date(
          formData.expenditure_date
        ).toISOString(),
      };

      if (editingExpenditure) {
        await api.put(
          `expenditures/${editingExpenditure.id}/`,
          payload
        );

        setSuccess(
          "Expenditure updated successfully."
        );
      } else {
        await api.post(
          "expenditures/",
          payload
        );

        setSuccess(
          "Expenditure recorded successfully."
        );
      }

      await loadExpenditures();

      setTimeout(() => {
        closeModal();
      }, 700);
    } catch (error) {
      console.error(
        "Expenditure save error:",
        error
      );

      const responseData = error.response?.data;

      if (typeof responseData === "string") {
        setError(responseData);
      } else if (responseData?.detail) {
        setError(responseData.detail);
      } else if (responseData) {
        const firstError =
          Object.values(responseData)[0];

        if (Array.isArray(firstError)) {
          setError(firstError[0]);
        } else {
          setError(String(firstError));
        }
      } else {
        setError(
          "Unable to save expenditure."
        );
      }
    }
  };

  // --------------------------------------------------
  // DELETE
  // --------------------------------------------------

  const handleDelete = async (expenditure) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expenditure record?"
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await api.delete(
        `expenditures/${expenditure.id}/`
      );

      setExpenditures((previous) =>
        previous.filter(
          (item) => item.id !== expenditure.id
        )
      );

      setSuccess(
        "Expenditure deleted successfully."
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (error) {
      console.error(
        "Expenditure delete error:",
        error
      );

      setError(
        error.response?.data?.detail ||
          "Unable to delete expenditure."
      );
    }
  };

  // --------------------------------------------------
  // DATE HELPERS
  // --------------------------------------------------

  function getCurrentDateTime() {
    const now = new Date();
    const offset = now.getTimezoneOffset();

    const localDate = new Date(
      now.getTime() - offset * 60 * 1000
    );

    return localDate
      .toISOString()
      .slice(0, 16);
  }

  function formatDateTimeForInput(value) {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const offset = date.getTimezoneOffset();

    const localDate = new Date(
      date.getTime() - offset * 60 * 1000
    );

    return localDate
      .toISOString()
      .slice(0, 16);
  }

  function formatDateTime(value) {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>
            <ReceiptText size={28} />
            Expenditures
          </h1>

          <p>
            Record and manage military asset
            expenditures.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            className="secondary-btn"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={
                refreshing ? "spin" : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

          {(isAdmin || isCommander) && (
            <button
              className="primary-btn"
              onClick={openAddModal}
            >
              <Plus size={18} />
              Add Expenditure
            </button>
          )}
        </div>
      </div>

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      {error && !showModal && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="table-toolbar">
        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search expenditures..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />

          {searchTerm && (
            <button
              type="button"
              className="clear-search"
              onClick={() => setSearchTerm("")}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="table-count">
          {filteredExpenditures.length} record
          {filteredExpenditures.length !== 1
            ? "s"
            : ""}
        </div>
      </div>

      <div className="table-card">
        {loading ? (
          <div className="loading-state">
            Loading expenditures...
          </div>
        ) : filteredExpenditures.length === 0 ? (
          <div className="empty-state">
            <ReceiptText size={42} />

            <h3>
              No expenditures found
            </h3>

            <p>
              {searchTerm
                ? "Try a different search."
                : "There are no expenditure records."}
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Base</th>
                  <th>Equipment</th>
                  <th>Quantity</th>
                  <th>Reason</th>
                  <th>Expenditure Date</th>
                  <th>Recorded By</th>

                  {isAdmin && (
                    <th>Actions</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredExpenditures.map(
                  (expenditure) => (
                    <tr key={expenditure.id}>
                      <td>
                        #{expenditure.id}
                      </td>

                      <td>
                        {expenditure.base_name ||
                          "-"}
                      </td>

                      <td>
                        {expenditure.equipment_name ||
                          "-"}
                      </td>

                      <td>
                        <span className="quantity-badge">
                          {expenditure.quantity}
                        </span>
                      </td>

                      <td>
                        <span
                          title={
                            expenditure.reason
                          }
                        >
                          {expenditure.reason}
                        </span>
                      </td>

                      <td>
                        {formatDateTime(
                          expenditure.expenditure_date
                        )}
                      </td>

                      <td>
                        {expenditure.recorded_by_username ||
                          "-"}
                      </td>

                      {isAdmin && (
                        <td>
                          <div className="action-buttons">
                            <button
                              type="button"
                              className="icon-btn edit-btn"
                              title="Edit expenditure"
                              onClick={() =>
                                openEditModal(
                                  expenditure
                                )
                              }
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              type="button"
                              className="icon-btn delete-btn"
                              title="Delete expenditure"
                              onClick={() =>
                                handleDelete(
                                  expenditure
                                )
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h2>
                  {editingExpenditure
                    ? "Edit Expenditure"
                    : "Add Expenditure"}
                </h2>

                <p>
                  {editingExpenditure
                    ? "Update expenditure details."
                    : "Record equipment used or expended."}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {success && (
              <div className="success-message">
                {success}
              </div>
            )}

            <form
              className="modal-form"
              onSubmit={handleSubmit}
            >
              <div className="form-group">
                <label htmlFor="base">
                  Base
                </label>

                <select
                  id="base"
                  name="base"
                  value={formData.base}
                  onChange={handleInputChange}
                  disabled={isCommander}
                  required
                >
                  <option value="">
                    Select Base
                  </option>

                  {bases.map((base) => (
                    <option
                      key={base.id}
                      value={base.id}
                    >
                      {base.name}
                    </option>
                  ))}
                </select>

                {isCommander && (
                  <small>
                    You can only record expenditures
                    for your assigned base.
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="equipment_type">
                  Equipment Type
                </label>

                <select
                  id="equipment_type"
                  name="equipment_type"
                  value={
                    formData.equipment_type
                  }
                  onChange={handleInputChange}
                  required
                >
                  <option value="">
                    Select Equipment
                  </option>

                  {equipment.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="quantity">
                  Quantity
                </label>

                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  placeholder="Enter quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                />

                <small>
                  Quantity cannot exceed available
                  stock.
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="reason">
                  Reason
                </label>

                <textarea
                  id="reason"
                  name="reason"
                  rows="4"
                  placeholder="Enter reason for expenditure"
                  value={formData.reason}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="expenditure_date">
                  Expenditure Date
                </label>

                <input
                  id="expenditure_date"
                  name="expenditure_date"
                  type="datetime-local"
                  value={
                    formData.expenditure_date
                  }
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                >
                  {editingExpenditure
                    ? "Update Expenditure"
                    : "Record Expenditure"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Expenditures;
import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Transfers() {
  const { user } = useAuth();

  const [transfers, setTransfers] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipment, setEquipment] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState(null);

  const [formData, setFormData] = useState({
    from_base: "",
    to_base: "",
    equipment_type: "",
    quantity: "",
    transfer_date: "",
    reference_number: "",
    status: "COMPLETED",
  });

  /*
   * Only ADMIN can edit and delete.
   * ADMIN, COMMANDER and LOGISTICS can create/view.
   */
  const isAdmin = user?.role === "ADMIN";

  /*
   * Load transfers
   */
  const loadTransfers = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("transfers/");

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      setTransfers(data);
    } catch (err) {
      console.error("Error loading transfers:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load transfer records."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Load bases
   */
  const loadBases = async () => {
    try {
      const response = await api.get("bases/");

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      setBases(data);
    } catch (err) {
      console.error("Error loading bases:", err);
    }
  };

  /*
   * Load equipment
   */
  const loadEquipment = async () => {
    try {
      const response = await api.get("equipment/");

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      setEquipment(data);
    } catch (err) {
      console.error("Error loading equipment:", err);
    }
  };

  /*
   * Initial loading
   */
  useEffect(() => {
    loadTransfers();
    loadBases();
    loadEquipment();
  }, []);

  /*
   * Clear messages
   */
  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  /*
   * Open Add modal
   */
  const openAddModal = () => {
    clearMessages();

    setEditingTransfer(null);

    setFormData({
      from_base: "",
      to_base: "",
      equipment_type: "",
      quantity: "",
      transfer_date: "",
      reference_number: "",
      status: "COMPLETED",
    });

    setShowModal(true);
  };

  /*
   * Open Edit modal
   */
  const openEditModal = (transfer) => {
    clearMessages();

    setEditingTransfer(transfer);

    setFormData({
      from_base: transfer.from_base || "",
      to_base: transfer.to_base || "",
      equipment_type: transfer.equipment_type || "",
      quantity: transfer.quantity || "",
      transfer_date: transfer.transfer_date
        ? transfer.transfer_date.slice(0, 16)
        : "",
      reference_number: transfer.reference_number || "",
      status: transfer.status || "COMPLETED",
    });

    setShowModal(true);
  };

  /*
   * Close modal
   */
  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingTransfer(null);
  };

  /*
   * Handle input changes
   */
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /*
   * Convert API errors to readable text
   */
  const getErrorMessage = (err, defaultMessage) => {
    const responseData = err.response?.data;

    if (!responseData) {
      return defaultMessage;
    }

    if (typeof responseData === "string") {
      return responseData;
    }

    if (responseData.detail) {
      return responseData.detail;
    }

    if (typeof responseData === "object") {
      return Object.entries(responseData)
        .map(([field, message]) => {
          const text = Array.isArray(message)
            ? message.join(", ")
            : String(message);

          return `${field}: ${text}`;
        })
        .join(" | ");
    }

    return defaultMessage;
  };

  /*
   * Submit Add/Edit form
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    clearMessages();

    if (!formData.from_base) {
      setError("Please select the source base.");
      return;
    }

    if (!formData.to_base) {
      setError("Please select the destination base.");
      return;
    }

    if (
      Number(formData.from_base) ===
      Number(formData.to_base)
    ) {
      setError(
        "Source and destination bases must be different."
      );
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

    if (!formData.transfer_date) {
      setError("Please select a transfer date and time.");
      return;
    }

    if (!formData.reference_number.trim()) {
      setError("Please enter a reference number.");
      return;
    }

    if (!formData.status) {
      setError("Please select a transfer status.");
      return;
    }

    setSaving(true);

    const payload = {
      from_base: Number(formData.from_base),
      to_base: Number(formData.to_base),
      equipment_type: Number(formData.equipment_type),
      quantity: Number(formData.quantity),
      transfer_date: formData.transfer_date,
      reference_number:
        formData.reference_number.trim(),
      status: formData.status,
    };

    try {
      if (editingTransfer) {
        await api.put(
          `transfers/${editingTransfer.id}/`,
          payload
        );

        setSuccess("Transfer updated successfully.");
      } else {
        await api.post("transfers/", payload);

        setSuccess("Transfer created successfully.");
      }

      setShowModal(false);
      setEditingTransfer(null);

      await loadTransfers();
    } catch (err) {
      console.error("Error saving transfer:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to save transfer."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * Delete transfer
   */
  const handleDelete = async (transfer) => {
    clearMessages();

    const confirmed = window.confirm(
      `Are you sure you want to delete transfer "${transfer.reference_number}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `transfers/${transfer.id}/`
      );

      setSuccess("Transfer deleted successfully.");

      await loadTransfers();
    } catch (err) {
      console.error("Error deleting transfer:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to delete transfer."
        )
      );
    }
  };

  /*
   * Search transfers
   */
  const filteredTransfers = transfers.filter(
    (transfer) => {
      const searchText = search.toLowerCase();

      return (
        String(transfer.id || "")
          .toLowerCase()
          .includes(searchText) ||
        String(transfer.reference_number || "")
          .toLowerCase()
          .includes(searchText) ||
        String(transfer.from_base_name || "")
          .toLowerCase()
          .includes(searchText) ||
        String(transfer.to_base_name || "")
          .toLowerCase()
          .includes(searchText) ||
        String(transfer.equipment_name || "")
          .toLowerCase()
          .includes(searchText) ||
        String(transfer.quantity || "")
          .toLowerCase()
          .includes(searchText) ||
        String(transfer.status || "")
          .toLowerCase()
          .includes(searchText) ||
        String(transfer.created_by_username || "")
          .toLowerCase()
          .includes(searchText)
      );
    }
  );

  /*
   * Format date/time
   */
  const formatDateTime = (dateTime) => {
    if (!dateTime) {
      return "-";
    }

    const date = new Date(dateTime);

    if (Number.isNaN(date.getTime())) {
      return dateTime;
    }

    return date.toLocaleString();
  };

  /*
   * Status CSS class
   */
  const getStatusClass = (status) => {
    switch (status) {
      case "COMPLETED":
        return "status-completed";

      case "CANCELLED":
        return "status-cancelled";

      default:
        return "status-badge";
    }
  };

  return (
    <div className="page-container">

      {/* PAGE HEADER */}
      <div className="page-header">

        <div>
          <h1>Transfers</h1>

          <p>
            Manage movement of military assets
            between bases.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={openAddModal}
        >
          <Plus size={17} />
          Add Transfer
        </button>

      </div>

      {/* SUCCESS MESSAGE */}
      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* TOOLBAR */}
      <div className="table-toolbar">

        <div className="search-box">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search transfers..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

        </div>

        <div className="toolbar-actions">

          <span className="record-count">
            {filteredTransfers.length} record
            {filteredTransfers.length !== 1
              ? "s"
              : ""}
          </span>

          <button
            className="secondary-btn"
            onClick={loadTransfers}
            disabled={loading}
          >
            <RefreshCw
              size={16}
              className={loading ? "spin" : ""}
            />

            Refresh
          </button>

        </div>

      </div>

      {/* TRANSFERS TABLE */}
      <div className="table-card">

        {loading ? (
          <div className="empty-state">
            <p>Loading transfers...</p>
          </div>
        ) : filteredTransfers.length === 0 ? (
          <div className="empty-state">

            <h3>No transfers found</h3>

            <p>
              There are no transfer records
              matching your search.
            </p>

          </div>
        ) : (
          <div className="table-wrapper">

            <table className="data-table">

              <thead>

                <tr>
                  <th>ID</th>
                  <th>Reference</th>
                  <th>From Base</th>
                  <th>To Base</th>
                  <th>Equipment</th>
                  <th>Quantity</th>
                  <th>Transfer Date</th>
                  <th>Status</th>
                  <th>Created By</th>

                  {isAdmin && (
                    <th>Actions</th>
                  )}
                </tr>

              </thead>

              <tbody>

                {filteredTransfers.map(
                  (transfer) => (
                    <tr key={transfer.id}>

                      <td>
                        #{transfer.id}
                      </td>

                      <td>
                        <strong>
                          {transfer.reference_number}
                        </strong>
                      </td>

                      <td>
                        {transfer.from_base_name ||
                          "-"}
                      </td>

                      <td>
                        {transfer.to_base_name ||
                          "-"}
                      </td>

                      <td>
                        {transfer.equipment_name ||
                          "-"}
                      </td>

                      <td>
                        {transfer.quantity}
                      </td>

                      <td>
                        {formatDateTime(
                          transfer.transfer_date
                        )}
                      </td>

                      <td>
                        <span
                          className={`status-badge ${getStatusClass(
                            transfer.status
                          )}`}
                        >
                          {transfer.status || "-"}
                        </span>
                      </td>

                      <td>
                        {transfer.created_by_username ||
                          "-"}
                      </td>

                      {isAdmin && (
                        <td>

                          <div className="action-buttons">

                            <button
                              type="button"
                              className="icon-btn edit-btn"
                              title="Edit transfer"
                              onClick={() =>
                                openEditModal(
                                  transfer
                                )
                              }
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              type="button"
                              className="icon-btn delete-btn"
                              title="Delete transfer"
                              onClick={() =>
                                handleDelete(
                                  transfer
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

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="modal-overlay">

          <div className="modal-card">

            <div className="modal-header">

              <div>

                <h2>
                  {editingTransfer
                    ? "Edit Transfer"
                    : "Add Transfer"}
                </h2>

                <p>
                  {editingTransfer
                    ? "Update the transfer details."
                    : "Enter the transfer details below."}
                </p>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={20} />
              </button>

            </div>

            <form
              className="modal-form"
              onSubmit={handleSubmit}
            >

              {/* FROM BASE */}
              <div className="form-group">

                <label htmlFor="from_base">
                  From Base
                </label>

                <select
                  id="from_base"
                  name="from_base"
                  value={formData.from_base}
                  onChange={handleChange}
                  disabled={saving}
                >

                  <option value="">
                    Select source base
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

              </div>

              {/* TO BASE */}
              <div className="form-group">

                <label htmlFor="to_base">
                  To Base
                </label>

                <select
                  id="to_base"
                  name="to_base"
                  value={formData.to_base}
                  onChange={handleChange}
                  disabled={saving}
                >

                  <option value="">
                    Select destination base
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

              </div>

              {/* EQUIPMENT */}
              <div className="form-group">

                <label htmlFor="equipment_type">
                  Equipment Type
                </label>

                <select
                  id="equipment_type"
                  name="equipment_type"
                  value={formData.equipment_type}
                  onChange={handleChange}
                  disabled={saving}
                >

                  <option value="">
                    Select equipment
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

              {/* QUANTITY */}
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
                  onChange={handleChange}
                  disabled={saving}
                />

              </div>

              {/* TRANSFER DATE */}
              <div className="form-group">

                <label htmlFor="transfer_date">
                  Transfer Date & Time
                </label>

                <input
                  id="transfer_date"
                  name="transfer_date"
                  type="datetime-local"
                  value={formData.transfer_date}
                  onChange={handleChange}
                  disabled={saving}
                />

              </div>

              {/* REFERENCE NUMBER */}
              <div className="form-group">

                <label htmlFor="reference_number">
                  Reference Number
                </label>

                <input
                  id="reference_number"
                  name="reference_number"
                  type="text"
                  placeholder="Example: TR-002"
                  value={formData.reference_number}
                  onChange={handleChange}
                  disabled={saving}
                />

              </div>

              {/* STATUS */}
              <div className="form-group">

                <label htmlFor="status">
                  Status
                </label>

                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={saving}
                >

                  <option value="COMPLETED">
                    Completed
                  </option>

                  <option value="CANCELLED">
                    Cancelled
                  </option>

                </select>

              </div>

              {/* MODAL BUTTONS */}
              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingTransfer
                    ? "Update Transfer"
                    : "Add Transfer"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default Transfers;
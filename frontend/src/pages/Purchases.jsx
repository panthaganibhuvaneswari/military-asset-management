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

function Purchases() {
  const { user } = useAuth();

  const [purchases, setPurchases] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipment, setEquipment] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);

  const [formData, setFormData] = useState({
    base: "",
    equipment_type: "",
    quantity: "",
    purchase_date: "",
    reference_number: "",
  });

  /*
   * Only ADMIN can edit and delete purchases.
   * COMMANDER and LOGISTICS can create/view.
   */
  const isAdmin = user?.role === "ADMIN";

  /*
   * Load purchases
   */
  const loadPurchases = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("purchases/");

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      setPurchases(data);
    } catch (err) {
      console.error("Error loading purchases:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load purchase records."
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
   * Load equipment types
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
    loadPurchases();
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
   * Open Add Purchase modal
   */
  const openAddModal = () => {
    clearMessages();

    setEditingPurchase(null);

    setFormData({
      base: "",
      equipment_type: "",
      quantity: "",
      purchase_date: "",
      reference_number: "",
    });

    setShowModal(true);
  };

  /*
   * Open Edit Purchase modal
   */
  const openEditModal = (purchase) => {
    clearMessages();

    setEditingPurchase(purchase);

    setFormData({
      base: purchase.base || "",
      equipment_type: purchase.equipment_type || "",
      quantity: purchase.quantity || "",
      purchase_date: purchase.purchase_date || "",
      reference_number: purchase.reference_number || "",
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
    setEditingPurchase(null);
  };

  /*
   * Handle form changes
   */
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /*
   * Convert backend errors into readable text
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

    if (!formData.base) {
      setError("Please select a base.");
      return;
    }

    if (!formData.equipment_type) {
      setError("Please select an equipment type.");
      return;
    }

    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }

    if (!formData.purchase_date) {
      setError("Please select a purchase date.");
      return;
    }

    if (!formData.reference_number.trim()) {
      setError("Please enter a reference number.");
      return;
    }

    setSaving(true);

    const payload = {
      base: Number(formData.base),
      equipment_type: Number(formData.equipment_type),
      quantity: Number(formData.quantity),
      purchase_date: formData.purchase_date,
      reference_number: formData.reference_number.trim(),
    };

    try {
      if (editingPurchase) {
        await api.put(
          `purchases/${editingPurchase.id}/`,
          payload
        );

        setSuccess("Purchase updated successfully.");
      } else {
        await api.post("purchases/", payload);

        setSuccess("Purchase created successfully.");
      }

      setShowModal(false);
      setEditingPurchase(null);

      await loadPurchases();
    } catch (err) {
      console.error("Error saving purchase:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to save purchase."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * Delete purchase
   */
  const handleDelete = async (purchase) => {
    clearMessages();

    const confirmed = window.confirm(
      `Are you sure you want to delete purchase "${purchase.reference_number}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `purchases/${purchase.id}/`
      );

      setSuccess("Purchase deleted successfully.");

      await loadPurchases();
    } catch (err) {
      console.error("Error deleting purchase:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to delete purchase."
        )
      );
    }
  };

  /*
   * Search purchases
   */
  const filteredPurchases = purchases.filter(
    (purchase) => {
      const searchText = search.toLowerCase();

      return (
        String(purchase.id || "")
          .toLowerCase()
          .includes(searchText) ||
        String(purchase.reference_number || "")
          .toLowerCase()
          .includes(searchText) ||
        String(purchase.base_name || "")
          .toLowerCase()
          .includes(searchText) ||
        String(purchase.equipment_name || "")
          .toLowerCase()
          .includes(searchText) ||
        String(purchase.quantity || "")
          .toLowerCase()
          .includes(searchText) ||
        String(purchase.created_by_username || "")
          .toLowerCase()
          .includes(searchText)
      );
    }
  );

  /*
   * Format date
   */
  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parts = date.split("-");

    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    return date;
  };

  return (
    <div className="page-container">

      {/* PAGE HEADER */}
      <div className="page-header">

        <div>
          <h1>Purchases</h1>

          <p>
            Manage military equipment purchases
            and procurement records.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={openAddModal}
        >
          <Plus size={17} />
          Add Purchase
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
            placeholder="Search purchases..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

        </div>

        <div className="toolbar-actions">

          <span className="record-count">
            {filteredPurchases.length} record
            {filteredPurchases.length !== 1
              ? "s"
              : ""}
          </span>

          <button
            className="secondary-btn"
            onClick={loadPurchases}
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

      {/* PURCHASE TABLE */}
      <div className="table-card">

        {loading ? (
          <div className="empty-state">
            <p>Loading purchases...</p>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="empty-state">

            <h3>No purchases found</h3>

            <p>
              There are no purchase records
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
                  <th>Base</th>
                  <th>Equipment</th>
                  <th>Quantity</th>
                  <th>Purchase Date</th>
                  <th>Created By</th>

                  {isAdmin && (
                    <th>Actions</th>
                  )}
                </tr>

              </thead>

              <tbody>

                {filteredPurchases.map(
                  (purchase) => (
                    <tr key={purchase.id}>

                      <td>
                        #{purchase.id}
                      </td>

                      <td>
                        <strong>
                          {purchase.reference_number}
                        </strong>
                      </td>

                      <td>
                        {purchase.base_name || "-"}
                      </td>

                      <td>
                        {purchase.equipment_name || "-"}
                      </td>

                      <td>
                        {purchase.quantity}
                      </td>

                      <td>
                        {formatDate(
                          purchase.purchase_date
                        )}
                      </td>

                      <td>
                        {purchase.created_by_username ||
                          "-"}
                      </td>

                      {isAdmin && (
                        <td>

                          <div className="action-buttons">

                            <button
                              type="button"
                              className="icon-btn edit-btn"
                              title="Edit purchase"
                              onClick={() =>
                                openEditModal(
                                  purchase
                                )
                              }
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              type="button"
                              className="icon-btn delete-btn"
                              title="Delete purchase"
                              onClick={() =>
                                handleDelete(
                                  purchase
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
                  {editingPurchase
                    ? "Edit Purchase"
                    : "Add Purchase"}
                </h2>

                <p>
                  {editingPurchase
                    ? "Update the purchase details."
                    : "Enter the purchase details below."}
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

              {/* BASE */}
              <div className="form-group">

                <label htmlFor="base">
                  Base
                </label>

                <select
                  id="base"
                  name="base"
                  value={formData.base}
                  onChange={handleChange}
                  disabled={saving}
                >

                  <option value="">
                    Select base
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

              {/* PURCHASE DATE */}
              <div className="form-group">

                <label htmlFor="purchase_date">
                  Purchase Date
                </label>

                <input
                  id="purchase_date"
                  name="purchase_date"
                  type="date"
                  value={formData.purchase_date}
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
                  placeholder="Example: PO-004"
                  value={formData.reference_number}
                  onChange={handleChange}
                  disabled={saving}
                />

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
                    : editingPurchase
                    ? "Update Purchase"
                    : "Add Purchase"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default Purchases;
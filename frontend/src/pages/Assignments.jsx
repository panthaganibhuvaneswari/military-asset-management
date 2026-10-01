import { useEffect, useMemo, useState } from "react";

import {
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  X,
  ClipboardList,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Assignments() {
  const { user } = useAuth();

  const [assignments, setAssignments] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipment, setEquipment] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);

  const [formData, setFormData] = useState({
    base: "",
    equipment_type: "",
    personnel_name: "",
    quantity: "",
    assigned_date: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isAdmin = user?.role === "ADMIN";
  const isCommander = user?.role === "COMMANDER";

  const commanderBaseId =
    user?.base_id !== null && user?.base_id !== undefined
      ? String(user.base_id)
      : "";

  // --------------------------------------------------
  // LOAD DATA
  // --------------------------------------------------

  const loadAssignments = async () => {
    try {
      const response = await api.get("assignments/");
      setAssignments(response.data);
    } catch (error) {
      console.error("Error loading assignments:", error);

      setError(
        error.response?.data?.detail ||
          "Unable to load assignments."
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
      console.error("Error loading equipment:", error);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    setError("");

    try {
      await Promise.all([
        loadAssignments(),
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
        loadAssignments(),
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

  const filteredAssignments = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return assignments;
    }

    return assignments.filter((assignment) => {
      return (
        String(assignment.id)
          .toLowerCase()
          .includes(search) ||
        String(assignment.base_name || "")
          .toLowerCase()
          .includes(search) ||
        String(assignment.equipment_name || "")
          .toLowerCase()
          .includes(search) ||
        String(assignment.personnel_name || "")
          .toLowerCase()
          .includes(search) ||
        String(assignment.quantity || "")
          .toLowerCase()
          .includes(search) ||
        String(assignment.assigned_by_username || "")
          .toLowerCase()
          .includes(search)
      );
    });
  }, [assignments, searchTerm]);

  // --------------------------------------------------
  // MODAL
  // --------------------------------------------------

  const openAddModal = () => {
    setEditingAssignment(null);

    setFormData({
      base: isCommander
        ? commanderBaseId
        : "",
      equipment_type: "",
      personnel_name: "",
      quantity: "",
      assigned_date: getCurrentDateTime(),
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (assignment) => {
    setEditingAssignment(assignment);

    setFormData({
      base: assignment.base
        ? String(assignment.base)
        : "",
      equipment_type: assignment.equipment_type
        ? String(assignment.equipment_type)
        : "",
      personnel_name:
        assignment.personnel_name || "",
      quantity: assignment.quantity || "",
      assigned_date: formatDateTimeForInput(
        assignment.assigned_date
      ),
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAssignment(null);

    setFormData({
      base: "",
      equipment_type: "",
      personnel_name: "",
      quantity: "",
      assigned_date: "",
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

    if (!formData.personnel_name.trim()) {
      setError("Please enter personnel name.");
      return;
    }

    if (
      !formData.quantity ||
      Number(formData.quantity) <= 0
    ) {
      setError("Quantity must be greater than zero.");
      return;
    }

    if (!formData.assigned_date) {
      setError("Please select assigned date.");
      return;
    }

    // Commander can only use assigned base
    if (
      isCommander &&
      String(formData.base) !== commanderBaseId
    ) {
      setError(
        "You can only create assignments for your assigned base."
      );
      return;
    }

    const payload = {
      base: Number(formData.base),
      equipment_type: Number(
        formData.equipment_type
      ),
      personnel_name:
        formData.personnel_name.trim(),
      quantity: Number(formData.quantity),
      assigned_date: new Date(
        formData.assigned_date
      ).toISOString(),
    };

    try {
      if (editingAssignment) {
        await api.put(
          `assignments/${editingAssignment.id}/`,
          payload
        );

        setSuccess(
          "Assignment updated successfully."
        );
      } else {
        await api.post(
          "assignments/",
          payload
        );

        setSuccess(
          "Assignment created successfully."
        );
      }

      await loadAssignments();

      setTimeout(() => {
        closeModal();
      }, 700);
    } catch (error) {
      console.error(
        "Assignment save error:",
        error
      );

      const responseData =
        error.response?.data;

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
          "Unable to save assignment."
        );
      }
    }
  };

  // --------------------------------------------------
  // DELETE
  // --------------------------------------------------

  const handleDelete = async (assignment) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the assignment for ${assignment.personnel_name}?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await api.delete(
        `assignments/${assignment.id}/`
      );

      setAssignments((previous) =>
        previous.filter(
          (item) => item.id !== assignment.id
        )
      );

      setSuccess(
        "Assignment deleted successfully."
      );

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (error) {
      console.error(
        "Assignment delete error:",
        error
      );

      setError(
        error.response?.data?.detail ||
          "Unable to delete assignment."
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
      now.getTime() -
        offset * 60 * 1000
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
      date.getTime() -
        offset * 60 * 1000
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

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>
            <ClipboardList size={28} />
            Assignments
          </h1>

          <p>
            Manage military equipment
            assignments to personnel.
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
              Add Assignment
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
            placeholder="Search assignments..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />

          {searchTerm && (
            <button
              type="button"
              className="clear-search"
              onClick={() =>
                setSearchTerm("")
              }
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="table-count">
          {filteredAssignments.length}{" "}
          assignment
          {filteredAssignments.length !== 1
            ? "s"
            : ""}
        </div>
      </div>

      <div className="table-card">
                {loading ? (
          <div className="loading-state">
            Loading assignments...
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={42} />

            <h3>
              No assignments found
            </h3>

            <p>
              {searchTerm
                ? "Try a different search."
                : "No assignments are available."}
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
                  <th>Personnel</th>
                  <th>Quantity</th>
                  <th>Assigned Date</th>
                  <th>Assigned By</th>

                  {isAdmin && (
                    <th>Actions</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredAssignments.map(
                  (assignment) => (
                    <tr
                      key={assignment.id}
                    >
                      <td>
                        #{assignment.id}
                      </td>

                      <td>
                        {assignment.base_name ||
                          "-"}
                      </td>

                      <td>
                        {assignment.equipment_name ||
                          "-"}
                      </td>

                      <td>
                        <strong>
                          {
                            assignment.personnel_name
                          }
                        </strong>
                      </td>

                      <td>
                        <span className="quantity-badge">
                          {assignment.quantity}
                        </span>
                      </td>

                      <td>
                        {formatDateTime(
                          assignment.assigned_date
                        )}
                      </td>

                      <td>
                        {assignment.assigned_by_username ||
                          "-"}
                      </td>

                      {isAdmin && (
                        <td>
                          <div className="action-buttons">
                            <button
                              type="button"
                              className="icon-btn edit-btn"
                              title="Edit assignment"
                              onClick={() =>
                                openEditModal(
                                  assignment
                                )
                              }
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              type="button"
                              className="icon-btn delete-btn"
                              title="Delete assignment"
                              onClick={() =>
                                handleDelete(
                                  assignment
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
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div className="modal-card">

            <div className="modal-header">
              <div>
                <h2>
                  {editingAssignment
                    ? "Edit Assignment"
                    : "Add Assignment"}
                </h2>

                <p>
                  {editingAssignment
                    ? "Update assignment details."
                    : "Assign equipment to personnel."}
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

              {/* BASE */}

              <div className="form-group">
                <label htmlFor="base">
                  Base
                </label>

                <select
                  id="base"
                  name="base"
                  value={String(
                    formData.base || ""
                  )}
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
                      value={String(base.id)}
                    >
                      {base.name}
                    </option>
                  ))}
                </select>

                {isCommander && (
                  <small>
                    You can only create
                    assignments for your
                    assigned base.
                  </small>
                )}
              </div>

              {/* EQUIPMENT */}

              <div className="form-group">
                <label htmlFor="equipment_type">
                  Equipment Type
                </label>

                <select
                  id="equipment_type"
                  name="equipment_type"
                  value={String(
                    formData.equipment_type ||
                      ""
                  )}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">
                    Select Equipment
                  </option>

                  {equipment.map((item) => (
                    <option
                      key={item.id}
                      value={String(item.id)}
                    >
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* PERSONNEL */}

              <div className="form-group">
                <label htmlFor="personnel_name">
                  Personnel Name
                </label>

                <input
                  id="personnel_name"
                  name="personnel_name"
                  type="text"
                  placeholder="Enter personnel name"
                  value={
                    formData.personnel_name
                  }
                  onChange={handleInputChange}
                  maxLength={150}
                  required
                />
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
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* ASSIGNED DATE */}

              <div className="form-group">
                <label htmlFor="assigned_date">
                  Assigned Date
                </label>

                <input
                  id="assigned_date"
                  name="assigned_date"
                  type="datetime-local"
                  value={
                    formData.assigned_date
                  }
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* BUTTONS */}

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
                  {editingAssignment
                    ? "Update Assignment"
                    : "Create Assignment"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Assignments;
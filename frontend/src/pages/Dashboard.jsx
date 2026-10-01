import { useEffect, useState } from "react";

import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  ClipboardList,
  LogOut,
  Package,
  Shield,
  TrendingUp,
  Truck,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user, logout } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);

  const isCommander = user?.role === "COMMANDER";
  const isAdmin = user?.role === "ADMIN";

  /*
   * Commanders must always work with their assigned base.
   *
   * AuthContext stores this value as:
   * user.base_id
   */
  const commanderBaseId = user?.base_id
    ? String(user.base_id)
    : "";

  const [filters, setFilters] = useState({
    base: isCommander ? commanderBaseId : "",
    equipment_type: "",
    start_date: "",
    end_date: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMovementDetails, setShowMovementDetails] =
    useState(false);

  // --------------------------------------------------
  // LOAD DASHBOARD
  // --------------------------------------------------

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};

      /*
       * For Commander, always send their assigned base.
       * Even if something tries to change the filter,
       * the frontend keeps the assigned base.
       */
      if (isCommander && commanderBaseId) {
        params.base = commanderBaseId;
      } else if (filters.base) {
        params.base = filters.base;
      }

      if (filters.equipment_type) {
        params.equipment_type =
          filters.equipment_type;
      }

      if (filters.start_date) {
        params.start_date = filters.start_date;
      }

      if (filters.end_date) {
        params.end_date = filters.end_date;
      }

      const response = await api.get("dashboard/", {
        params,
      });

      setDashboard(response.data);
    } catch (err) {
      console.error("Dashboard error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // LOAD FILTER DATA
  // --------------------------------------------------

  const loadFilters = async () => {
    try {
      const [
        basesResponse,
        equipmentResponse,
      ] = await Promise.all([
        api.get("bases/"),
        api.get("equipment/"),
      ]);

      const allBases =
        basesResponse.data.results ||
        basesResponse.data;

      const allEquipment =
        equipmentResponse.data.results ||
        equipmentResponse.data;

      /*
       * Admin can see all bases.
       *
       * Commander sees only their assigned base.
       *
       * Other roles receive the available bases
       * returned by the API.
       */
      if (isCommander) {
        const assignedBase = allBases.filter(
          (base) =>
            String(base.id) ===
            commanderBaseId
        );

        setBases(assignedBase);

        /*
         * Make sure Commander is always locked
         * to their assigned base.
         */
        setFilters((previous) => ({
          ...previous,
          base: commanderBaseId,
        }));
      } else {
        setBases(allBases);
      }

      setEquipmentTypes(allEquipment);
    } catch (err) {
      console.error(
        "Unable to load filters:",
        err
      );
    }
  };

  // --------------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------------

  useEffect(() => {
    loadFilters();
  }, []);

  // --------------------------------------------------
  // LOAD DASHBOARD WHEN FILTERS CHANGE
  // --------------------------------------------------

  useEffect(() => {
    loadDashboard();
  }, [
    filters.base,
    filters.equipment_type,
    filters.start_date,
    filters.end_date,
  ]);

  // --------------------------------------------------
  // FILTER CHANGE
  // --------------------------------------------------

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    /*
     * Commander cannot change the Base filter.
     */
    if (isCommander && name === "base") {
      return;
    }

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // --------------------------------------------------
  // CLEAR FILTERS
  // --------------------------------------------------

  const clearFilters = () => {
    setFilters({
      /*
       * Admin can clear the Base filter.
       *
       * Commander must remain on assigned base.
       */
      base: isCommander
        ? commanderBaseId
        : "",
      equipment_type: "",
      start_date: "",
      end_date: "",
    });
  };

  // --------------------------------------------------
  // INITIAL LOADING
  // --------------------------------------------------

  if (loading && !dashboard) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="dashboard-page">

      {/* TOP NAVBAR */}

      <header className="topbar">
        <div className="brand-section">

          <div className="brand-icon">
            <Shield size={24} />
          </div>

          <div>
            <h1>
              Military Asset Management
            </h1>

            <span>
              Asset Control Dashboard
            </span>
          </div>

        </div>

        <div className="user-section">

          <div className="user-info">
            <strong>
              {user?.username}
            </strong>

            <span>
              Authorized User
            </span>
          </div>

          <button
            className="logout-button"
            onClick={logout}
            title="Logout"
          >
            <LogOut size={18} />
            Logout
          </button>

        </div>
      </header>

      {/* MAIN CONTENT */}

      <main className="dashboard-content">

        {/* PAGE HEADING */}

        <div className="page-heading">

          <div>
            <h2>Dashboard</h2>

            <p>
              Monitor military equipment
              movement and inventory.
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={loadDashboard}
          >
            <Activity size={17} />
            Refresh
          </button>

        </div>

        {/* FILTERS */}

        <section className="filter-card">

          <div className="filter-title">
            <ClipboardList size={19} />
            <span>
              Dashboard Filters
            </span>
          </div>

          <div className="filter-grid">

            {/* BASE */}

            <div className="filter-group">

              <label>
                Base
              </label>

              <select
                name="base"
                value={filters.base}
                onChange={handleFilterChange}
                disabled={isCommander}
              >

                {/* ADMIN / OTHER ROLES */}

                {!isCommander && (
                  <option value="">
                    All Bases
                  </option>
                )}

                {/* COMMANDER */}

                {isCommander &&
                  bases.length === 0 && (
                    <option value="">
                      Assigned Base
                    </option>
                  )}

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
                  Dashboard is restricted to
                  your assigned base.
                </small>
              )}

            </div>

            {/* EQUIPMENT TYPE */}

            <div className="filter-group">

              <label>
                Equipment Type
              </label>

              <select
                name="equipment_type"
                value={
                  filters.equipment_type
                }
                onChange={
                  handleFilterChange
                }
              >

                <option value="">
                  All Equipment
                </option>

                {equipmentTypes.map(
                  (equipment) => (
                    <option
                      key={equipment.id}
                      value={equipment.id}
                    >
                      {equipment.name}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* START DATE */}

            <div className="filter-group">

              <label>
                Start Date
              </label>

              <input
                type="date"
                name="start_date"
                value={filters.start_date}
                onChange={
                  handleFilterChange
                }
              />

            </div>

            {/* END DATE */}

            <div className="filter-group">

              <label>
                End Date
              </label>

              <input
                type="date"
                name="end_date"
                value={filters.end_date}
                onChange={
                  handleFilterChange
                }
              />

            </div>

            {/* CLEAR */}

            <button
              className="clear-filter-button"
              onClick={clearFilters}
            >
              Clear Filters
            </button>

          </div>

        </section>

        {/* ERROR */}

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        {/* METRIC CARDS */}

        {dashboard && (
          <>
            <section className="metrics-grid">

              <MetricCard
                title="Opening Balance"
                value={
                  dashboard.opening_balance
                }
                icon={<Boxes size={24} />}
              />

              <MetricCard
                title="Purchases"
                value={
                  dashboard.purchases
                }
                icon={<Package size={24} />}
              />

              <MetricCard
                title="Transfer In"
                value={
                  dashboard.transfer_in
                }
                icon={
                  <ArrowDownToLine
                    size={24}
                  />
                }
              />

              <MetricCard
                title="Transfer Out"
                value={
                  dashboard.transfer_out
                }
                icon={
                  <ArrowUpFromLine
                    size={24}
                  />
                }
              />

              <MetricCard
                title="Net Movement"
                value={
                  dashboard.net_movement
                }
                icon={
                  <TrendingUp
                    size={24}
                  />
                }
                clickable
                onClick={() =>
                  setShowMovementDetails(
                    true
                  )
                }
              />

              <MetricCard
                title="Assigned"
                value={
                  dashboard.assigned
                }
                icon={
                  <ClipboardList
                    size={24}
                  />
                }
              />

              <MetricCard
                title="Expended"
                value={
                  dashboard.expended
                }
                icon={
                  <Truck size={24} />
                }
              />

              <MetricCard
                title="Closing Balance"
                value={
                  dashboard.closing_balance
                }
                icon={
                  <Boxes size={24} />
                }
                highlight
              />

            </section>

            {/* MOVEMENT SUMMARY */}

            <section className="movement-section">

              <div className="section-heading">

                <div>
                  <h3>
                    Movement Summary
                  </h3>

                  <p>
                    Current inventory movement
                    based on selected filters.
                  </p>
                </div>

                <button
                  className="details-button"
                  onClick={() =>
                    setShowMovementDetails(
                      true
                    )
                  }
                >
                  View Details
                </button>

              </div>

              <div className="movement-summary">

                <div className="movement-item">

                  <span>
                    Purchases
                  </span>

                  <strong>
                    +{dashboard.purchases}
                  </strong>

                </div>

                <div className="movement-item">

                  <span>
                    Transfer In
                  </span>

                  <strong>
                    +{dashboard.transfer_in}
                  </strong>

                </div>

                <div className="movement-item">

                  <span>
                    Transfer Out
                  </span>

                  <strong>
                    -{dashboard.transfer_out}
                  </strong>

                </div>

                <div className="movement-total">

                  <span>
                    Net Movement
                  </span>

                  <strong>
                    {dashboard.net_movement}
                  </strong>

                </div>

              </div>

            </section>
          </>
        )}

      </main>

      {/* NET MOVEMENT POPUP */}

      {showMovementDetails &&
        dashboard && (
          <div
            className="modal-overlay"
            onClick={() =>
              setShowMovementDetails(false)
            }
          >

            <div
              className="movement-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="modal-header">

                <div>
                  <h3>
                    Net Movement Details
                  </h3>

                  <p>
                    Movement calculation for
                    the selected period.
                  </p>
                </div>

                <button
                  className="modal-close"
                  onClick={() =>
                    setShowMovementDetails(
                      false
                    )
                  }
                >
                  ×
                </button>

              </div>

              <div className="movement-calculation">

                <div className="calculation-row">

                  <span>
                    Purchases
                  </span>

                  <strong>
                    +{dashboard.purchases}
                  </strong>

                </div>

                <div className="calculation-row">

                  <span>
                    Transfer In
                  </span>

                  <strong>
                    +{dashboard.transfer_in}
                  </strong>

                </div>

                <div className="calculation-row">

                  <span>
                    Transfer Out
                  </span>

                  <strong>
                    -{dashboard.transfer_out}
                  </strong>

                </div>

                <div className="calculation-divider"></div>

                <div className="calculation-total">

                  <span>
                    Net Movement
                  </span>

                  <strong>
                    {dashboard.net_movement}
                  </strong>

                </div>

              </div>

              <div className="modal-footer">
                Net Movement = Purchases +
                Transfer In − Transfer Out
              </div>

            </div>

          </div>
        )}

    </div>
  );
}

// --------------------------------------------------
// METRIC CARD
// --------------------------------------------------

function MetricCard({
  title,
  value,
  icon,
  clickable = false,
  onClick,
  highlight = false,
}) {
  return (
    <div
      className={`metric-card ${
        clickable
          ? "metric-clickable"
          : ""
      } ${
        highlight
          ? "metric-highlight"
          : ""
      }`}
      onClick={
        clickable
          ? onClick
          : undefined
      }
    >

      <div className="metric-top">

        <div className="metric-icon">
          {icon}
        </div>

        {clickable && (
          <span className="view-indicator">
            View
          </span>
        )}

      </div>

      <div className="metric-title">
        {title}
      </div>

      <div className="metric-value">
        {value ?? 0}
      </div>

    </div>
  );
}

export default Dashboard;
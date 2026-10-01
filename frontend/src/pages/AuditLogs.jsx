import { useEffect, useState } from "react";
import { Search, RefreshCw } from "lucide-react";
import api from "../services/api";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================
  // LOAD AUDIT LOGS
  // =========================================

  const loadLogs = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("audit/");

      setLogs(response.data);
    } catch (err) {
      console.error("Error loading audit logs:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load audit logs."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadLogs();
  }, []);


  // =========================================
  // SEARCH
  // =========================================

  const filteredLogs = logs.filter((log) => {
    const searchText = search.toLowerCase();

    return (
      String(log.id || "")
        .toLowerCase()
        .includes(searchText) ||

      String(log.username || "")
        .toLowerCase()
        .includes(searchText) ||

      String(log.action || "")
        .toLowerCase()
        .includes(searchText) ||

      String(log.entity || "")
        .toLowerCase()
        .includes(searchText) ||

      String(log.entity_id || "")
        .toLowerCase()
        .includes(searchText) ||

      JSON.stringify(log.details || {})
        .toLowerCase()
        .includes(searchText)
    );
  });


  // =========================================
  // ACTION CLASS
  // =========================================

  const getActionClass = (action) => {
    switch (action) {
      case "CREATE":
        return "status-completed";

      case "UPDATE":
        return "status-badge";

      case "DELETE":
        return "status-cancelled";

      case "LOGIN":
        return "status-completed";

      case "LOGOUT":
        return "status-badge";

      default:
        return "status-badge";
    }
  };


  // =========================================
  // FORMAT DETAILS
  // =========================================

  const formatDetails = (details) => {
    if (!details || Object.keys(details).length === 0) {
      return "-";
    }

    return JSON.stringify(details);
  };


  return (
    <div className="page-container">


      {/* =========================================
          PAGE HEADER
      ========================================== */}

      <div className="page-header">

        <div>

          <h1>
            Audit Logs
          </h1>

          <p>
            Track important actions performed in the system.
          </p>

        </div>

      </div>


      {/* =========================================
          ERROR
      ========================================== */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


      {/* =========================================
          TOOLBAR
      ========================================== */}

      <div className="table-toolbar">

        <div className="search-box">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search audit logs..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>


        <div className="toolbar-actions">

          <span className="record-count">
            {filteredLogs.length} record
            {filteredLogs.length !== 1
              ? "s"
              : ""}
          </span>


          <button
            className="secondary-btn"
            onClick={loadLogs}
            disabled={loading}
          >

            <RefreshCw
              size={16}
              className={
                loading ? "spin" : ""
              }
            />

            Refresh

          </button>

        </div>

      </div>


      {/* =========================================
          AUDIT TABLE
      ========================================== */}

      <div className="table-card">

        {loading ? (

          <div className="empty-state">
            Loading audit logs...
          </div>

        ) : filteredLogs.length === 0 ? (

          <div className="empty-state">

            <h3>
              No audit logs found
            </h3>

            <p>
              There are no audit records matching your search.
            </p>

          </div>

        ) : (

          <div className="table-wrapper">

            <table className="data-table">

              <thead>

                <tr>

                  <th>
                    ID
                  </th>

                  <th>
                    User
                  </th>

                  <th>
                    Action
                  </th>

                  <th>
                    Entity
                  </th>

                  <th>
                    Entity ID
                  </th>

                  <th>
                    Details
                  </th>

                  <th>
                    IP Address
                  </th>

                  <th>
                    Date & Time
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredLogs.map((log) => (

                  <tr key={log.id}>

                    {/* ID */}

                    <td>
                      #{log.id}
                    </td>


                    {/* USER */}

                    <td>

                      <strong>
                        {log.username || "-"}
                      </strong>

                    </td>


                    {/* ACTION */}

                    <td>

                      <span
                        className={`status-badge ${getActionClass(
                          log.action
                        )}`}
                      >
                        {log.action || "-"}
                      </span>

                    </td>


                    {/* ENTITY */}

                    <td>
                      {log.entity || "-"}
                    </td>


                    {/* ENTITY ID */}

                    <td>
                      {log.entity_id || "-"}
                    </td>


                    {/* DETAILS */}

                    <td
                      title={formatDetails(
                        log.details
                      )}
                    >
                      <span className="audit-details">
                        {formatDetails(
                          log.details
                        )}
                      </span>
                    </td>


                    {/* IP ADDRESS */}

                    <td>
                      {log.ip_address || "-"}
                    </td>


                    {/* TIMESTAMP */}

                    <td>

                      {log.timestamp
                        ? new Date(
                            log.timestamp
                          ).toLocaleString()
                        : "-"}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}

export default AuditLogs;
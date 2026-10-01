import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Purchases from "./pages/Purchases";
import Transfers from "./pages/Transfers";
import Assignments from "./pages/Assignments";
import Expenditures from "./pages/Expenditures";
import AuditLogs from "./pages/AuditLogs";

import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";


function App() {
  return (
    <Routes>

      {/* =====================================================
          LOGIN
      ====================================================== */}

      <Route
        path="/login"
        element={<Login />}
      />


      {/* =====================================================
          PROTECTED APPLICATION
          
          DashboardLayout wraps all authenticated pages.
      ====================================================== */}

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >


        {/* ===================================================
            DASHBOARD

            ADMIN
            COMMANDER
            LOGISTICS
        ==================================================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "COMMANDER",
                "LOGISTICS",
              ]}
            >
              <Dashboard />
            </ProtectedRoute>
          }
        />


        {/* ===================================================
            PURCHASES

            ADMIN
            COMMANDER
            LOGISTICS
        ==================================================== */}

        <Route
          path="/purchases"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "COMMANDER",
                "LOGISTICS",
              ]}
            >
              <Purchases />
            </ProtectedRoute>
          }
        />


        {/* ===================================================
            TRANSFERS

            ADMIN
            COMMANDER
            LOGISTICS
        ==================================================== */}

        <Route
          path="/transfers"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "COMMANDER",
                "LOGISTICS",
              ]}
            >
              <Transfers />
            </ProtectedRoute>
          }
        />


        {/* ===================================================
            ASSIGNMENTS

            ADMIN
            COMMANDER
        ==================================================== */}

        <Route
          path="/assignments"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "COMMANDER",
              ]}
            >
              <Assignments />
            </ProtectedRoute>
          }
        />


        {/* ===================================================
            EXPENDITURES

            ADMIN
            COMMANDER
        ==================================================== */}

        <Route
          path="/expenditures"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "COMMANDER",
              ]}
            >
              <Expenditures />
            </ProtectedRoute>
          }
        />


        {/* ===================================================
            AUDIT LOGS

            ADMIN ONLY
        ==================================================== */}

        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
              ]}
            >
              <AuditLogs />
            </ProtectedRoute>
          }
        />

      </Route>


      {/* =====================================================
          DEFAULT ROUTE

          Opening:
          http://localhost:5173/

          redirects to Dashboard.
      ====================================================== */}

      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />


      {/* =====================================================
          UNKNOWN ROUTES

          Any invalid URL redirects to Dashboard.
      ====================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

    </Routes>
  );
}


export default App;
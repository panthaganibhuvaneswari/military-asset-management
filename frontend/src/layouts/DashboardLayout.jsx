import { NavLink, Outlet, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  ShoppingCart,
  ArrowLeftRight,
  UserCheck,
  PackageMinus,
  FileText,
  LogOut,
  Shield,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";


function DashboardLayout() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();


  // =========================================
  // LOGOUT
  // =========================================

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };


  // =========================================
  // ROLE-BASED MENU
  // =========================================

  const allMenuItems = [

    // Dashboard
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      roles: [
        "ADMIN",
        "COMMANDER",
        "LOGISTICS",
      ],
    },


    // Purchases
    {
      name: "Purchases",
      path: "/purchases",
      icon: ShoppingCart,
      roles: [
        "ADMIN",
        "COMMANDER",
        "LOGISTICS",
      ],
    },


    // Transfers
    {
      name: "Transfers",
      path: "/transfers",
      icon: ArrowLeftRight,
      roles: [
        "ADMIN",
        "COMMANDER",
        "LOGISTICS",
      ],
    },


    // Assignments
    {
      name: "Assignments",
      path: "/assignments",
      icon: UserCheck,
      roles: [
        "ADMIN",
        "COMMANDER",
      ],
    },


    // Expenditures
    {
      name: "Expenditures",
      path: "/expenditures",
      icon: PackageMinus,
      roles: [
        "ADMIN",
        "COMMANDER",
      ],
    },


    // Audit Logs
    // ADMIN only
    {
      name: "Audit Logs",
      path: "/audit-logs",
      icon: FileText,
      roles: [
        "ADMIN",
      ],
    },

  ];


  // =========================================
  // FILTER MENU BASED ON USER ROLE
  // =========================================

  const menuItems = allMenuItems.filter((item) =>
    item.roles.includes(user?.role)
  );


  // =========================================
  // DISPLAY ROLE NAME
  // =========================================

  const getRoleName = () => {

    if (!user?.role) {
      return "Authorized User";
    }


    switch (user.role) {

      case "ADMIN":
        return "Administrator";

      case "COMMANDER":
        return "Commander";

      case "LOGISTICS":
        return "Logistics Officer";

      default:
        return "Authorized User";
    }
  };


  return (
    <div className="app-layout">


      {/* =================================================
          SIDEBAR
      ================================================== */}

      <aside className="sidebar">


        {/* ===============================================
            SIDEBAR LOGO
        ================================================ */}

        <div className="sidebar-logo">

          <div className="logo-icon">
            <Shield size={24} />
          </div>


          <div>

            <h2>
              Military AMS
            </h2>

            <span>
              Asset Management
            </span>

          </div>

        </div>


        {/* ===============================================
            NAVIGATION
        ================================================ */}

        <nav className="sidebar-nav">

          <div className="nav-section-title">
            MAIN MENU
          </div>


          {menuItems.map((item) => {

            const Icon = item.icon;


            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-link ${
                    isActive ? "active" : ""
                  }`
                }
              >

                <Icon size={19} />

                <span>
                  {item.name}
                </span>

              </NavLink>
            );

          })}

        </nav>


        {/* =================================================
            SIDEBAR BOTTOM
        ================================================== */}

        <div className="sidebar-bottom">


          {/* ===============================================
              USER INFORMATION
          ================================================ */}

          <div className="user-info">

            <div className="user-avatar">

              {user?.username
                ? user.username
                    .charAt(0)
                    .toUpperCase()
                : "U"}

            </div>


            <div className="user-details">

              <strong>
                {user?.username || "User"}
              </strong>

              <span>
                {getRoleName()}
              </span>

            </div>

          </div>


          {/* ===============================================
              LOGOUT
          ================================================ */}

          <button
            className="logout-button"
            onClick={handleLogout}
          >

            <LogOut size={18} />

            <span>
              Logout
            </span>

          </button>


        </div>

      </aside>


      {/* =================================================
          MAIN CONTENT
      ================================================== */}

      <main className="main-content">


        {/* ===============================================
            TOP HEADER
        ================================================ */}

        <header className="top-header">


          <div>

            <h3>
              Military Asset Management System
            </h3>

            <p>
              Track and manage military assets securely.
            </p>

          </div>


          {/* =============================================
              SYSTEM STATUS
          ============================================== */}

          <div className="header-user">

            <span className="online-dot"></span>

            <span>
              System Online
            </span>

          </div>


        </header>


        {/* ===============================================
            PAGE CONTENT
        ================================================ */}

        <div className="content-area">

          <Outlet />

        </div>


      </main>


    </div>
  );
}


export default DashboardLayout;
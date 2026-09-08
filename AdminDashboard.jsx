import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const DEFAULT_LIMITS = {
  CL: 7,
  SL: 7,
  EL: 7,
  LWP: 7,
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");

  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [filter, setFilter] = useState("ALL");

  const [sidebarOpen, setSidebarOpen] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1024 : false
  );

  const [activeTab, setActiveTab] = useState("PROFILE");
  const [currentView, setCurrentView] = useState("profile");

  // ================= ADD EMPLOYEE =================

  const [newEmpCode, setNewEmpCode] = useState("");
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpEmail, setNewEmpEmail] = useState("");
  const [newEmpDept, setNewEmpDept] = useState("IT");
  const [newEmpDesig, setNewEmpDesig] =
    useState("Software Engineer");
  const [newEmpGender, setNewEmpGender] = useState("Male");
  const [addEmpMsg, setAddEmpMsg] = useState("");

  // ================= LEAVE FORM =================

  const [leaveType, setLeaveType] = useState("CL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  // ================= PASSWORD =================

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [pwdMsg, setPwdMsg] = useState("");

  // ================= PROFILE =================

  const [isEditModalOpen, setIsEditModalOpen] =
    useState(false);

  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone] = useState("");
  const [picture, setPicture] = useState("");

  // ================= LEAVE LIMITS =================

  const [leaveLimits, setLeaveLimits] = useState(() => {
    try {
      const saved = localStorage.getItem("leaveLimits");

      if (saved) {
        return {
          ...DEFAULT_LIMITS,
          ...JSON.parse(saved),
        };
      }
    } catch (error) {
      console.error("Leave limits load error:", error);
    }

    return DEFAULT_LIMITS;
  });

  const [leaveLimitMsg, setLeaveLimitMsg] = useState("");

  // ================= LOAD USER =================

  useEffect(() => {
    try {
      const savedUser = JSON.parse(
        localStorage.getItem("user")
      );

      const savedToken = localStorage.getItem("token");

      if (!savedUser || !savedToken) {
        navigate("/");
        return;
      }

      if (savedUser.role !== "admin") {
        navigate("/");
        return;
      }

      setUser(savedUser);
      setToken(savedToken);

      setDepartment(savedUser.department || "");
      setDesignation(savedUser.designation || "");
      setPhone(savedUser.phone || "");
      setPicture(savedUser.picture || "");

      fetchAllLeaves(savedToken);
      fetchAllEmployees(savedToken);
    } catch (error) {
      console.error(error);
      navigate("/");
    }
  }, [navigate]);

  // ================= FETCH LEAVES =================

  const fetchAllLeaves = async (authToken = token) => {
    try {
      const response = await fetch(
        `${API_URL}/api/leaves/all`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch leaves");
      }

      const data = await response.json();

      setLeaves(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Leaves error:", error);
      setLeaves([]);
    }
  };

  // ================= FETCH EMPLOYEES =================

  const fetchAllEmployees = async (
    authToken = token
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/api/admin/employees`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }

      const data = await response.json();

      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Employees error:", error);
      setEmployees([]);
    }
  };

  // ================= NAVIGATION =================

  const changeTab = (tab, view = null) => {
    setActiveTab(tab);

    if (view) {
      setCurrentView(view);
    }

    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  // ================= ADD EMPLOYEE =================

  const handleAddEmployee = async (e) => {
    e.preventDefault();

    setAddEmpMsg("");

    if (!newEmpCode.trim() || !newEmpName.trim()) {
      setAddEmpMsg(
        "Employee Code aur Name zaroori hain."
      );
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/admin/add-employee`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            empCode: newEmpCode.trim(),
            name: newEmpName.trim(),
            email: newEmpEmail.trim(),
            department: newEmpDept,
            designation: newEmpDesig,
            gender: newEmpGender,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Employee add nahi hua."
        );
      }

      setAddEmpMsg(
        "Employee successfully add ho gaya! Default password Employee Code hai."
      );

      setNewEmpCode("");
      setNewEmpName("");
      setNewEmpEmail("");

      fetchAllEmployees(token);
    } catch (error) {
      setAddEmpMsg(error.message);
    }
  };

  // ================= IMAGE =================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setPicture(reader.result);
    };

    reader.readAsDataURL(file);
  };

  // ================= APPLY LEAVE =================

  const handleApplyLeave = async (e) => {
    e.preventDefault();

    if (!startDate || !endDate || !reason.trim()) {
      alert("Please fill all leave details.");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      alert("End date start date se pehle nahi ho sakti.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/leaves/apply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            leaveType,
            startDate,
            endDate,
            reason,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Leave apply nahi hui."
        );
      }

      alert("Leave successfully apply ho gayi.");

      setStartDate("");
      setEndDate("");
      setReason("");

      fetchAllLeaves(token);
    } catch (error) {
      alert(error.message);
    }
  };

  // ================= UPDATE LEAVE STATUS =================

  const handleUpdateStatus = async (id, status) => {
    try {
      const response = await fetch(
        `${API_URL}/api/leaves/status/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Status update failed."
        );
      }

      fetchAllLeaves(token);
    } catch (error) {
      alert(error.message);
    }
  };

  // ================= CHANGE PASSWORD =================

  const handleChangePassword = async (e) => {
    e.preventDefault();

    setPwdMsg("");

    if (
      !oldPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setPwdMsg("All password fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdMsg("New password aur confirm password same nahi hain.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/auth/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            oldPassword,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Password update failed."
        );
      }

      setPwdMsg(
        "Password successfully change ho gaya."
      );

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPwdMsg(error.message);
    }
  };

  // ================= UPDATE PROFILE =================

  const handleUpdateProfile = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/auth/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            department,
            phone,
            designation,
            picture,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Profile update failed."
        );
      }

      const updatedUser = {
        ...user,
        ...data.user,
      };

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      setUser(updatedUser);
      setIsEditModalOpen(false);

      alert("Profile updated successfully.");
    } catch (error) {
      alert(error.message);
    }
  };

  // ================= SAVE LEAVE LIMITS =================

  const handleSaveLeaveLimits = () => {
    const cleanedLimits = {
      CL: Math.max(
        0,
        Number.parseInt(leaveLimits.CL, 10) || 0
      ),
      SL: Math.max(
        0,
        Number.parseInt(leaveLimits.SL, 10) || 0
      ),
      EL: Math.max(
        0,
        Number.parseInt(leaveLimits.EL, 10) || 0
      ),
      LWP: Math.max(
        0,
        Number.parseInt(leaveLimits.LWP, 10) || 0
      ),
    };

    setLeaveLimits(cleanedLimits);

    localStorage.setItem(
      "leaveLimits",
      JSON.stringify(cleanedLimits)
    );

    setLeaveLimitMsg(
      "Leave limits successfully save ho gayi."
    );

    setTimeout(() => {
      setLeaveLimitMsg("");
    }, 3000);
  };

  const handleLimitChange = (type, value) => {
    setLeaveLimits((previous) => ({
      ...previous,
      [type]: value,
    }));
  };

  // ================= LOGOUT =================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  };

  // ================= SAFE DATA =================

  const safeLeaves = Array.isArray(leaves)
    ? leaves
    : [];

  const safeEmployees = Array.isArray(employees)
    ? employees
    : [];

  const filteredLeaves =
    filter === "ALL"
      ? safeLeaves
      : safeLeaves.filter(
          (leave) => leave.status === filter
        );

  const pendingCount = safeLeaves.filter(
    (leave) => leave.status === "Pending"
  ).length;

  const approvedCount = safeLeaves.filter(
    (leave) => leave.status === "Approved"
  ).length;

  const rejectedCount = safeLeaves.filter(
    (leave) => leave.status === "Rejected"
  ).length;

  // ================= SIDEBAR =================

  const sidebarItems = [
    {
      id: "PROFILE",
      label: "Profile",
      icon: "👤",
      view: "profile",
    },
    {
      id: "ADD EMPLOYEE",
      label: "Add Employee",
      icon: "➕",
      view: "employees",
    },
    {
      id: "LEAVE LIMITS",
      label: "Leave Limits",
      icon: "⚙️",
      view: "leave-limits",
    },
    {
      id: "REQUISITIONS",
      label: "Requisitions",
      icon: "📝",
      view: "requisitions",
    },
    {
      id: "APPROVE REQUISITIONS",
      label: "Approve Requisitions",
      icon: "✅",
      view: "approve",
    },
    {
      id: "REPORTS",
      label: "Reports",
      icon: "📊",
      view: "reports",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {/* ================= TOP NAVBAR ================= */}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                setSidebarOpen(!sidebarOpen)
              }
              className="rounded-xl bg-slate-100 px-3 py-2 text-xl transition hover:bg-slate-200 lg:hidden"
            >
              ☰
            </button>

            <div>
              <h1 className="text-lg font-bold sm:text-xl">
                Leave Management
              </h1>

              <p className="hidden text-xs text-slate-500 sm:block">
                Admin Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">
                {user?.name || "Administrator"}
              </p>

              <p className="text-xs text-slate-500">
                Administrator
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ================= MOBILE OVERLAY ================= */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}

      <aside
        className={`
          fixed left-0 top-16 z-40 h-[calc(100vh-4rem)]
          w-72 border-r border-slate-200 bg-white
          transition-transform duration-300
          lg:translate-x-0
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        <div className="flex h-full flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Administration
            </p>

            <div className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    changeTab(item.id, item.view)
                  }
                  className={`
                    flex w-full items-center gap-3 rounded-xl
                    px-4 py-3 text-left text-sm font-semibold
                    transition
                    ${
                      activeTab === item.id
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100"
                    }
                  `}
                >
                  <span className="text-lg">
                    {item.icon}
                  </span>

                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 p-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Logged in as
              </p>

              <p className="mt-1 truncate text-sm font-bold">
                {user?.email || "Admin"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ================= MAIN ================= */}

      <main className="lg:ml-72">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">

          {/* ================================================= */}
          {/* PROFILE */}
          {/* ================================================= */}

          {activeTab === "PROFILE" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">
                  Admin Profile
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Manage your profile and account settings.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-1">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4 h-24 w-24 overflow-hidden rounded-full bg-slate-200">
                      {picture ? (
                        <img
                          src={picture}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-4xl">
                          👤
                        </div>
                      )}
                    </div>

                    <h3 className="text-lg font-bold">
                      {user?.name || "Administrator"}
                    </h3>

                    <p className="text-sm text-slate-500">
                      {user?.email}
                    </p>

                    <button
                      onClick={() =>
                        setIsEditModalOpen(true)
                      }
                      className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Edit Profile
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
                  <h3 className="text-lg font-bold">
                    Profile Information
                  </h3>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <InfoBox
                      label="Employee Code"
                      value={user?.empCode || "ADMIN"}
                    />

                    <InfoBox
                      label="Department"
                      value={
                        user?.department || "Management"
                      }
                    />

                    <InfoBox
                      label="Designation"
                      value={
                        user?.designation ||
                        "System Administrator"
                      }
                    />

                    <InfoBox
                      label="Phone"
                      value={user?.phone || "Not added"}
                    />
                  </div>
                </div>
              </div>

              {/* CHANGE PASSWORD */}

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold">
                  Change Password
                </h3>

                <form
                  onSubmit={handleChangePassword}
                  className="mt-5 grid gap-4 md:grid-cols-3"
                >
                  <input
                    type="password"
                    placeholder="Old password"
                    value={oldPassword}
                    onChange={(e) =>
                      setOldPassword(e.target.value)
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500"
                  />

                  <input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(e.target.value)
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500"
                  />

                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500"
                  />

                  <button
                    type="submit"
                    className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800 md:col-span-3"
                  >
                    Change Password
                  </button>
                </form>

                {pwdMsg && (
                  <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm font-medium">
                    {pwdMsg}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ================================================= */}
          {/* ADD EMPLOYEE */}
          {/* ================================================= */}

          {activeTab === "ADD EMPLOYEE" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">
                  Add Employee
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create a new employee account.
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
                <form
                  onSubmit={handleAddEmployee}
                  className="grid gap-4 md:grid-cols-2"
                >
                  <Input
                    label="Employee Code"
                    value={newEmpCode}
                    onChange={setNewEmpCode}
                    placeholder="EMP001"
                  />

                  <Input
                    label="Employee Name"
                    value={newEmpName}
                    onChange={setNewEmpName}
                    placeholder="Employee Name"
                  />

                  <Input
                    label="Email"
                    value={newEmpEmail}
                    onChange={setNewEmpEmail}
                    placeholder="employee@company.com"
                  />

                  <Select
                    label="Department"
                    value={newEmpDept}
                    onChange={setNewEmpDept}
                    options={[
                      "IT",
                      "HR",
                      "Finance",
                      "Production",
                      "Sales",
                      "Management",
                    ]}
                  />

                  <Input
                    label="Designation"
                    value={newEmpDesig}
                    onChange={setNewEmpDesig}
                    placeholder="Software Engineer"
                  />

                  <Select
                    label="Gender"
                    value={newEmpGender}
                    onChange={setNewEmpGender}
                    options={[
                      "Male",
                      "Female",
                      "Other",
                    ]}
                  />

                  <button
                    type="submit"
                    className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800 md:col-span-2"
                  >
                    Add Employee
                  </button>
                </form>

                {addEmpMsg && (
                  <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm font-medium">
                    {addEmpMsg}
                  </div>
                )}
              </div>

              {/* EMPLOYEE DIRECTORY */}

              <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
                <h3 className="text-lg font-bold">
                  Employee Directory
                </h3>

                <div className="mt-5 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                        <th className="px-4 py-3">
                          Employee
                        </th>
                        <th className="px-4 py-3">
                          Code
                        </th>
                        <th className="px-4 py-3">
                          Department
                        </th>
                        <th className="px-4 py-3">
                          Designation
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {safeEmployees.map((emp) => (
                        <tr
                          key={emp._id}
                          className="border-b border-slate-100"
                        >
                          <td className="px-4 py-4">
                            <p className="font-semibold">
                              {emp.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {emp.email}
                            </p>
                          </td>

                          <td className="px-4 py-4 font-medium">
                            {emp.empCode}
                          </td>

                          <td className="px-4 py-4">
                            {emp.department}
                          </td>

                          <td className="px-4 py-4">
                            {emp.designation}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================= */}
          {/* LEAVE LIMITS */}
          {/* ================================================= */}

          {activeTab === "LEAVE LIMITS" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">
                  Leave Limits & Policy
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Set the maximum number of days an employee
                  can take for each leave type.
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-6 rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold">
                    Current Leave Policy
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Ye limits abhi local browser storage me
                    save hongi. Backend enforcement next step
                    me add karenge.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {/* CL */}

                  <LeaveLimitCard
                    code="CL"
                    title="Casual Leave"
                    value={leaveLimits.CL}
                    onChange={(value) =>
                      handleLimitChange("CL", value)
                    }
                    description="Casual Leave"
                  />

                  {/* SL */}

                  <LeaveLimitCard
                    code="SL"
                    title="Sick Leave"
                    value={leaveLimits.SL}
                    onChange={(value) =>
                      handleLimitChange("SL", value)
                    }
                    description="Sick Leave"
                  />

                  {/* EL */}

                  <LeaveLimitCard
                    code="EL"
                    title="Earned Leave"
                    value={leaveLimits.EL}
                    onChange={(value) =>
                      handleLimitChange("EL", value)
                    }
                    description="Earned Leave"
                  />

                  {/* LWP */}

                  <LeaveLimitCard
                    code="LWP"
                    title="Leave Without Pay"
                    value={leaveLimits.LWP}
                    onChange={(value) =>
                      handleLimitChange("LWP", value)
                    }
                    description="Leave Without Pay"
                  />
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    onClick={handleSaveLeaveLimits}
                    className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
                  >
                    Save Leave Limits
                  </button>

                  {leaveLimitMsg && (
                    <p className="rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                      ✓ {leaveLimitMsg}
                    </p>
                  )}
                </div>
              </div>

              {/* SUMMARY */}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <LimitSummary
                  code="CL"
                  title="Casual Leave"
                  value={leaveLimits.CL}
                />

                <LimitSummary
                  code="SL"
                  title="Sick Leave"
                  value={leaveLimits.SL}
                />

                <LimitSummary
                  code="EL"
                  title="Earned Leave"
                  value={leaveLimits.EL}
                />

                <LimitSummary
                  code="LWP"
                  title="Leave Without Pay"
                  value={leaveLimits.LWP}
                />
              </div>
            </div>
          )}

          {/* ================================================= */}
          {/* REQUISITIONS */}
          {/* ================================================= */}

          {activeTab === "REQUISITIONS" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">
                  Leave Requisition
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Apply leave from the admin account.
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
                <form
                  onSubmit={handleApplyLeave}
                  className="grid gap-5"
                >
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Leave Type
                    </label>

                    <select
                      value={leaveType}
                      onChange={(e) =>
                        setLeaveType(e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none"
                    >
                      <option value="CL">
                        Casual Leave
                      </option>

                      <option value="EL">
                        Earned Leave
                      </option>

                      <option value="CO">
                        Compensatory Off
                      </option>
                    </select>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        Start Date
                      </label>

                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) =>
                          setStartDate(e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        End Date
                      </label>

                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) =>
                          setEndDate(e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Reason
                    </label>

                    <textarea
                      value={reason}
                      onChange={(e) =>
                        setReason(e.target.value)
                      }
                      rows="4"
                      placeholder="Enter leave reason..."
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
                  >
                    Apply Leave
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ================================================= */}
          {/* APPROVE REQUISITIONS */}
          {/* ================================================= */}

          {activeTab === "APPROVE REQUISITIONS" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">
                  Approve Requisitions
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Review and manage employee leave requests.
                </p>
              </div>

              {/* FILTER */}

              <div className="flex flex-wrap gap-2">
                {["ALL", "Pending", "Approved", "Rejected"].map(
                  (item) => (
                    <button
                      key={item}
                      onClick={() => setFilter(item)}
                      className={`
                        rounded-xl px-4 py-2 text-sm font-semibold
                        ${
                          filter === item
                            ? "bg-slate-900 text-white"
                            : "bg-white text-slate-600 hover:bg-slate-100"
                        }
                      `}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>

              {/* MOBILE CARDS */}

              <div className="space-y-4 lg:hidden">
                {filteredLeaves.map((leave) => (
                  <div
                    key={leave._id}
                    className="rounded-2xl bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">
                          {leave.user?.name ||
                            leave.applicantName ||
                            "Employee"}
                        </p>

                        <p className="text-xs text-slate-500">
                          {leave.user?.email ||
                            leave.applicantEmail ||
                            ""}
                        </p>
                      </div>

                      <StatusBadge
                        status={leave.status}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-400">
                          Type
                        </p>

                        <p className="font-semibold">
                          {leave.leaveType || "CL"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Dates
                        </p>

                        <p className="font-semibold">
                          {formatDate(
                            leave.startDate
                          )}{" "}
                          -{" "}
                          {formatDate(
                            leave.endDate
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs text-slate-400">
                        Reason
                      </p>

                      <p className="mt-1 text-sm">
                        {leave.reason}
                      </p>
                    </div>

                    {leave.status === "Pending" && (
                      <div className="mt-5 flex gap-2">
                        <button
                          onClick={() =>
                            handleUpdateStatus(
                              leave._id,
                              "Approved"
                            )
                          }
                          className="flex-1 rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() =>
                            handleUpdateStatus(
                              leave._id,
                              "Rejected"
                            )
                          }
                          className="flex-1 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {filteredLeaves.length === 0 && (
                  <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">
                    No leave requests found.
                  </div>
                )}
              </div>

              {/* DESKTOP TABLE */}

              <div className="hidden overflow-hidden rounded-3xl bg-white shadow-sm lg:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-5 py-4">
                          Employee
                        </th>

                        <th className="px-5 py-4">
                          Type
                        </th>

                        <th className="px-5 py-4">
                          Dates
                        </th>

                        <th className="px-5 py-4">
                          Reason
                        </th>

                        <th className="px-5 py-4">
                          Status
                        </th>

                        <th className="px-5 py-4">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredLeaves.map((leave) => (
                        <tr
                          key={leave._id}
                          className="border-t border-slate-100"
                        >
                          <td className="px-5 py-4">
                            <p className="font-semibold">
                              {leave.user?.name ||
                                leave.applicantName ||
                                "Employee"}
                            </p>

                            <p className="text-xs text-slate-500">
                              {leave.user?.email ||
                                leave.applicantEmail ||
                                ""}
                            </p>
                          </td>

                          <td className="px-5 py-4 font-semibold">
                            {leave.leaveType || "CL"}
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap">
                            {formatDate(
                              leave.startDate
                            )}{" "}
                            -{" "}
                            {formatDate(
                              leave.endDate
                            )}
                          </td>

                          <td className="max-w-xs px-5 py-4">
                            <p className="truncate">
                              {leave.reason}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              status={leave.status}
                            />
                          </td>

                          <td className="px-5 py-4">
                            {leave.status ===
                            "Pending" ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(
                                      leave._id,
                                      "Approved"
                                    )
                                  }
                                  className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                                >
                                  Approve
                                </button>

                                <button
                                  onClick={() =>
                                    handleUpdateStatus(
                                      leave._id,
                                      "Rejected"
                                    )
                                  }
                                  className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">
                                No action
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================= */}
          {/* REPORTS */}
          {/* ================================================= */}

          {activeTab === "REPORTS" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">
                  Reports
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Leave management overview.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <ReportCard
                  title="Total Requests"
                  value={safeLeaves.length}
                  icon="📋"
                />

                <ReportCard
                  title="Pending"
                  value={pendingCount}
                  icon="⏳"
                />

                <ReportCard
                  title="Approved"
                  value={approvedCount}
                  icon="✅"
                />

                <ReportCard
                  title="Rejected"
                  value={rejectedCount}
                  icon="❌"
                />
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold">
                  Leave Limits
                </h3>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <LimitSummary
                    code="CL"
                    title="Casual Leave"
                    value={leaveLimits.CL}
                  />

                  <LimitSummary
                    code="SL"
                    title="Sick Leave"
                    value={leaveLimits.SL}
                  />

                  <LimitSummary
                    code="EL"
                    title="Earned Leave"
                    value={leaveLimits.EL}
                  />

                  <LimitSummary
                    code="LWP"
                    title="Leave Without Pay"
                    value={leaveLimits.LWP}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ================= EDIT PROFILE MODAL ================= */}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Edit Profile
                </h2>

                <p className="text-sm text-slate-500">
                  Update your information.
                </p>
              </div>

              <button
                onClick={() =>
                  setIsEditModalOpen(false)
                }
                className="rounded-xl bg-slate-100 px-3 py-2"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Profile Picture
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Department
                </label>

                <input
                  value={department}
                  onChange={(e) =>
                    setDepartment(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Designation
                </label>

                <input
                  value={designation}
                  onChange={(e) =>
                    setDesignation(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Phone
                </label>

                <input
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none"
                />
              </div>

              <button
                onClick={handleUpdateProfile}
                className="w-full rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================
// COMPONENTS
// =====================================================

function Input({
  label,
  value,
  onChange,
  placeholder,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-500"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold">
        {value}
      </p>
    </div>
  );
}

function LeaveLimitCard({
  code,
  title,
  value,
  onChange,
  description,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 font-bold text-white">
          {code}
        </div>

        <span className="text-xs font-medium text-slate-400">
          Days / Year
        </span>
      </div>

      <h3 className="mt-4 font-bold">
        {title}
      </h3>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>

      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-bold outline-none focus:border-slate-500"
      />
    </div>
  );
}

function LimitSummary({
  code,
  title,
  value,
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold">
          {code}
        </span>

        <span className="text-2xl font-bold">
          {value}
        </span>
      </div>

      <p className="mt-3 text-sm font-semibold">
        {title}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        Maximum days per year
      </p>
    </div>
  );
}

function ReportCard({
  title,
  value,
  icon,
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>

        <span className="text-3xl font-bold">
          {value}
        </span>
      </div>

      <p className="mt-3 text-sm font-semibold text-slate-600">
        {title}
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  const classes = {
    Pending:
      "bg-amber-50 text-amber-700",
    Approved:
      "bg-green-50 text-green-700",
    Rejected:
      "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
        classes[status] ||
        "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

function formatDate(date) {
  if (!date) return "-";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return "-";
  }

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
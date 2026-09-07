import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function EmployeeDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || {}
  );

  const [activeTab, setActiveTab] = useState("PROFILE");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState("profile");

  const [leaves, setLeaves] = useState([]);

  const [leaveType, setLeaveType] = useState("CL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");

  const [editOpen, setEditOpen] = useState(false);

  const [department, setDepartment] = useState(user.department || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [designation, setDesignation] = useState(user.designation || "");
  const [costCenter, setCostCenter] = useState(user.costCenter || "");
  const [dob, setDob] = useState(user.dob || "");
  const [picture, setPicture] = useState(user.picture || "");

  const token = localStorage.getItem("token");

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    fetchMyLeaves();
  }, [token]);

  const fetchMyLeaves = async () => {
    try {
      const response = await fetch(`${API_URL}/api/leaves/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (Array.isArray(data)) {
        setLeaves(data);
      }
    } catch (error) {
      console.error("Failed to fetch leaves:", error);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setPicture(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          department,
          phone,
          dob,
          designation,
          costCenter,
          picture,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to update profile");
        return;
      }

      const updatedUser = {
        ...user,
        ...data.user,
        department,
        phone,
        dob,
        designation,
        costCenter,
        picture,
      };

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setEditOpen(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();

    if (!startDate || !endDate || !reason) {
      alert("Please fill all leave details.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/leaves/apply`, {
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
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to apply leave");
        return;
      }

      alert("Leave application submitted successfully!");

      setStartDate("");
      setEndDate("");
      setReason("");

      fetchMyLeaves();
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    setPwdMsg("");

    if (newPassword !== confirmPassword) {
      setPwdMsg("New password and confirm password do not match.");
      return;
    }

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPwdMsg("Please fill all password fields.");
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
        setPwdMsg(data.message || "Failed to change password");
        return;
      }

      setPwdMsg("Password changed successfully!");

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      setPwdMsg("Something went wrong.");
    }
  };

  const openProfile = () => {
    setActiveTab("PROFILE");
    setCurrentView("profile");
    setSidebarOpen(false);
  };

  const openLeaves = () => {
    setActiveTab("REQUISITIONS");
    setCurrentView("leaves");
    setSidebarOpen(false);
  };

  const openPassword = () => {
    setActiveTab("PROFILE");
    setCurrentView("password");
    setSidebarOpen(false);
  };

  const openReports = () => {
    setActiveTab("REPORTS");
    setSidebarOpen(false);
  };

  const getInitials = () => {
    const name =
      user.name || user.employeeName || user.email || "User";

    return name
      .split(" ")
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  };

  const getStatusClass = (status) => {
    const value = String(status || "").toLowerCase();

    if (value.includes("approved")) {
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    }

    if (value.includes("reject")) {
      return "bg-red-50 text-red-700 border border-red-200";
    }

    return "bg-amber-50 text-amber-700 border border-amber-200";
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed left-0 top-0 z-50 h-screen w-72
          bg-slate-950 text-white shadow-2xl
          transition-transform duration-300
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-full flex-col">

          {/* LOGO */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-orange-400">
                Leave Management
              </p>

              <h1 className="mt-1 text-xl font-bold">
                Employee Portal
              </h1>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            >
              ✕
            </button>
          </div>

          {/* USER CARD */}
          <div className="mx-4 mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">

              {picture ? (
                <img
                  src={picture}
                  alt="Profile"
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-orange-400"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-lg font-bold">
                  {getInitials()}
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {user.name ||
                    user.employeeName ||
                    "Employee"}
                </p>

                <p className="truncate text-xs text-slate-400">
                  {user.email || "Employee Account"}
                </p>
              </div>
            </div>
          </div>

          {/* NAVIGATION */}
          <nav className="mt-6 flex-1 space-y-2 px-4">

            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Menu
            </p>

            <button
              onClick={openProfile}
              className={`
                flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition
                ${
                  currentView === "profile" &&
                  activeTab === "PROFILE"
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              <span className="text-lg">👤</span>
              <span className="font-medium">My Profile</span>
            </button>

            <button
              onClick={openLeaves}
              className={`
                flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition
                ${
                  currentView === "leaves"
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              <span className="text-lg">📋</span>
              <span className="font-medium">
                Leave Requisitions
              </span>
            </button>

            <button
              onClick={openPassword}
              className={`
                flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition
                ${
                  currentView === "password"
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              <span className="text-lg">🔐</span>
              <span className="font-medium">
                Change Password
              </span>
            </button>

            <button
              onClick={openReports}
              className={`
                flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition
                ${
                  activeTab === "REPORTS"
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              <span className="text-lg">📊</span>
              <span className="font-medium">Reports</span>
            </button>

          </nav>

          {/* LOGOUT */}
          <div className="border-t border-white/10 p-4">
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
            >
              <span className="text-lg">↪</span>
              <span className="font-medium">Logout</span>
            </button>
          </div>

        </div>
      </aside>

      {/* MAIN */}
      <div className="min-h-screen lg:pl-72">

        {/* HEADER */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">

          <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

            <div className="flex items-center gap-3">

              {/* MOBILE MENU */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm hover:bg-slate-50 lg:hidden"
              >
                ☰
              </button>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Welcome back
                </p>

                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                  {user.name ||
                    user.employeeName ||
                    "Employee"}
                </h2>
              </div>
            </div>

            <div className="hidden items-center gap-4 sm:flex">

              <div className="text-right">
                <p className="text-xs text-slate-400">
                  Today
                </p>

                <p className="text-sm font-semibold text-slate-700">
                  {today}
                </p>
              </div>

              <div className="h-10 w-px bg-slate-200" />

              {picture ? (
                <img
                  src={picture}
                  alt="Profile"
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-600">
                  {getInitials()}
                </div>
              )}

            </div>
          </div>

          {/* TOP TABS */}
          <div className="overflow-x-auto border-t border-slate-100">
            <div className="flex min-w-max px-4 sm:px-6 lg:px-8">

              <button
                onClick={openProfile}
                className={`
                  border-b-2 px-4 py-3 text-sm font-semibold transition
                  ${
                    activeTab === "PROFILE"
                      ? "border-orange-500 text-orange-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }
                `}
              >
                PROFILE
              </button>

              <button
                onClick={openLeaves}
                className={`
                  border-b-2 px-4 py-3 text-sm font-semibold transition
                  ${
                    activeTab === "REQUISITIONS"
                      ? "border-orange-500 text-orange-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }
                `}
              >
                REQUISITIONS
              </button>

              <button
                onClick={openReports}
                className={`
                  border-b-2 px-4 py-3 text-sm font-semibold transition
                  ${
                    activeTab === "REPORTS"
                      ? "border-orange-500 text-orange-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }
                `}
              >
                REPORTS
              </button>

            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">

          {/* ================= PROFILE ================= */}

          {activeTab === "PROFILE" &&
            currentView === "profile" && (
              <div className="space-y-6">

                {/* PAGE TITLE */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

                  <div>
                    <p className="text-sm font-semibold text-orange-500">
                      EMPLOYEE PROFILE
                    </p>

                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                      Personal Information
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                      View and manage your employee information.
                    </p>
                  </div>

                  <button
                    onClick={() => setEditOpen(true)}
                    className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 active:scale-[0.98]"
                  >
                    ✎ Edit Profile
                  </button>

                </div>

                {/* PROFILE HERO */}
                <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 p-6 text-white shadow-xl sm:p-8">

                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

                    {picture ? (
                      <img
                        src={picture}
                        alt="Profile"
                        className="h-28 w-28 rounded-3xl object-cover ring-4 ring-white/10"
                      />
                    ) : (
                      <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-orange-500 text-4xl font-bold">
                        {getInitials()}
                      </div>
                    )}

                    <div className="min-w-0">

                      <p className="text-sm text-orange-300">
                        Employee
                      </p>

                      <h2 className="mt-1 truncate text-2xl font-bold sm:text-3xl">
                        {user.name ||
                          user.employeeName ||
                          "Employee"}
                      </h2>

                      <p className="mt-2 break-all text-sm text-slate-300">
                        {user.email || "No email available"}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">

                        {designation && (
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
                            {designation}
                          </span>
                        )}

                        {department && (
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
                            {department}
                          </span>
                        )}

                      </div>
                    </div>

                  </div>
                </div>

                {/* DETAILS */}
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-900">
                      Employee Details
                    </h3>

                    <p className="text-sm text-slate-500">
                      Your current employment information.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

                    <InfoCard
                      label="Employee ID"
                      value={
                        user.employeeId ||
                        user.id ||
                        "-"
                      }
                      icon="🪪"
                    />

                    <InfoCard
                      label="Email"
                      value={user.email || "-"}
                      icon="✉️"
                    />

                    <InfoCard
                      label="Department"
                      value={department || "-"}
                      icon="🏢"
                    />

                    <InfoCard
                      label="Designation"
                      value={designation || "-"}
                      icon="💼"
                    />

                    <InfoCard
                      label="Phone"
                      value={phone || "-"}
                      icon="📱"
                    />

                    <InfoCard
                      label="Cost Center"
                      value={costCenter || "-"}
                      icon="💰"
                    />

                    <InfoCard
                      label="Date of Birth"
                      value={dob || "-"}
                      icon="🎂"
                    />

                  </div>
                </div>

              </div>
            )}

          {/* ================= LEAVE ================= */}

          {activeTab === "REQUISITIONS" &&
            currentView === "leaves" && (
              <div className="space-y-6">

                <div>
                  <p className="text-sm font-semibold text-orange-500">
                    LEAVE MANAGEMENT
                  </p>

                  <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
                    Leave Requisitions
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Apply for leave and track your previous requests.
                  </p>
                </div>

                {/* APPLY FORM */}
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

                  <div className="mb-6 flex items-start gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-xl">
                      📝
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Apply for Leave
                      </h2>

                      <p className="text-sm text-slate-500">
                        Submit a new leave request.
                      </p>
                    </div>

                  </div>

                  <form onSubmit={handleApplyLeave}>

                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Leave Type
                        </label>

                        <select
                          value={leaveType}
                          onChange={(e) =>
                            setLeaveType(e.target.value)
                          }
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                        >
                          <option value="CL">
                            Casual Leave
                          </option>

                          <option value="SL">
                            Sick Leave
                          </option>

                          <option value="EL">
                            Earned Leave
                          </option>

                          <option value="LWP">
                            Leave Without Pay
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Start Date
                        </label>

                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) =>
                            setStartDate(e.target.value)
                          }
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          End Date
                        </label>

                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) =>
                            setEndDate(e.target.value)
                          }
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Reason
                        </label>

                        <input
                          type="text"
                          value={reason}
                          onChange={(e) =>
                            setReason(e.target.value)
                          }
                          placeholder="Enter reason"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                        />
                      </div>

                    </div>

                    <div className="mt-6 flex justify-end">

                      <button
                        type="submit"
                        className="w-full rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 sm:w-auto"
                      >
                        Submit Leave Request →
                      </button>

                    </div>

                  </form>
                </div>

                {/* HISTORY */}
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

                  <div className="flex flex-col gap-2 border-b border-slate-100 p-5 sm:p-7 md:flex-row md:items-center md:justify-between">

                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Leave History
                      </h2>

                      <p className="text-sm text-slate-500">
                        Track your submitted leave requests.
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
                      {leaves.length} Request
                      {leaves.length !== 1 ? "s" : ""}
                    </span>

                  </div>

                  {leaves.length === 0 ? (

                    <div className="px-5 py-16 text-center">

                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                        📭
                      </div>

                      <h3 className="mt-4 font-semibold text-slate-800">
                        No leave requests yet
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Your leave applications will appear here.
                      </p>

                    </div>

                  ) : (

                    <div className="overflow-x-auto">

                      <table className="w-full min-w-[700px] text-left text-sm">

                        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">

                          <tr>
                            <th className="px-5 py-4 font-semibold">
                              Type
                            </th>

                            <th className="px-5 py-4 font-semibold">
                              Start
                            </th>

                            <th className="px-5 py-4 font-semibold">
                              End
                            </th>

                            <th className="px-5 py-4 font-semibold">
                              Reason
                            </th>

                            <th className="px-5 py-4 font-semibold">
                              Status
                            </th>
                          </tr>

                        </thead>

                        <tbody className="divide-y divide-slate-100">

                          {leaves.map((leave, index) => (

                            <tr
                              key={
                                leave._id ||
                                leave.id ||
                                index
                              }
                              className="transition hover:bg-slate-50"
                            >

                              <td className="px-5 py-4">
                                <span className="font-semibold text-slate-800">
                                  {leave.leaveType ||
                                    leave.type ||
                                    "-"}
                                </span>
                              </td>

                              <td className="px-5 py-4 text-slate-600">
                                {leave.startDate
                                  ? new Date(
                                      leave.startDate
                                    ).toLocaleDateString(
                                      "en-IN"
                                    )
                                  : "-"}
                              </td>

                              <td className="px-5 py-4 text-slate-600">
                                {leave.endDate
                                  ? new Date(
                                      leave.endDate
                                    ).toLocaleDateString(
                                      "en-IN"
                                    )
                                  : "-"}
                              </td>

                              <td className="max-w-xs px-5 py-4 text-slate-600">
                                <p className="truncate">
                                  {leave.reason || "-"}
                                </p>
                              </td>

                              <td className="px-5 py-4">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                    leave.status
                                  )}`}
                                >
                                  {leave.status ||
                                    "Pending"}
                                </span>
                              </td>

                            </tr>

                          ))}

                        </tbody>

                      </table>

                    </div>

                  )}

                </div>

              </div>
            )}

          {/* ================= PASSWORD ================= */}

          {activeTab === "PROFILE" &&
            currentView === "password" && (
              <div className="mx-auto max-w-2xl">

                <div className="mb-6">

                  <p className="text-sm font-semibold text-orange-500">
                    ACCOUNT SECURITY
                  </p>

                  <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
                    Change Password
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Keep your account secure by using a strong password.
                  </p>

                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">

                  <div className="mb-7 flex items-center gap-4">

                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-2xl">
                      🔐
                    </div>

                    <div>
                      <h2 className="font-bold text-slate-900">
                        Update Password
                      </h2>

                      <p className="text-sm text-slate-500">
                        Enter your current password and choose a new one.
                      </p>
                    </div>

                  </div>

                  <form
                    onSubmit={handleChangePassword}
                    className="space-y-5"
                  >

                    <PasswordInput
                      label="Current Password"
                      value={oldPassword}
                      onChange={setOldPassword}
                      placeholder="Enter current password"
                    />

                    <PasswordInput
                      label="New Password"
                      value={newPassword}
                      onChange={setNewPassword}
                      placeholder="Enter new password"
                    />

                    <PasswordInput
                      label="Confirm New Password"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      placeholder="Confirm new password"
                    />

                    {pwdMsg && (
                      <div
                        className={`rounded-xl px-4 py-3 text-sm font-medium ${
                          pwdMsg.includes("successfully")
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {pwdMsg}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-orange-500 px-5 py-3.5 font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"
                    >
                      Change Password
                    </button>

                  </form>

                </div>

              </div>
            )}

          {/* ================= REPORTS ================= */}

          {activeTab === "REPORTS" && (
            <div className="space-y-6">

              <div>
                <p className="text-sm font-semibold text-orange-500">
                  ANALYTICS
                </p>

                <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
                  Reports
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  View your leave-related reports and insights.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                <StatCard
                  title="Total Requests"
                  value={leaves.length}
                  icon="📋"
                />

                <StatCard
                  title="Pending"
                  value={
                    leaves.filter((leave) =>
                      String(leave.status || "")
                        .toLowerCase()
                        .includes("pending")
                    ).length
                  }
                  icon="⏳"
                />

                <StatCard
                  title="Approved"
                  value={
                    leaves.filter((leave) =>
                      String(leave.status || "")
                        .toLowerCase()
                        .includes("approved")
                    ).length
                  }
                  icon="✓"
                />

              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">

                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50 text-4xl">
                  📊
                </div>

                <h2 className="mt-5 text-xl font-bold text-slate-900">
                  Reports Dashboard
                </h2>

                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                  Detailed leave analytics can be added here later,
                  including monthly leave trends, leave balance and
                  department-wise reports.
                </p>

              </div>

            </div>
          )}

        </main>
      </div>

      {/* ================= EDIT PROFILE MODAL ================= */}

      {editOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">

          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

            {/* MODAL HEADER */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-5 sm:px-7">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Edit Profile
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update your employee information.
                </p>
              </div>

              <button
                onClick={() => setEditOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>

            </div>

            <div className="space-y-6 p-5 sm:p-7">

              {/* PROFILE PICTURE */}
              <div className="rounded-2xl bg-slate-50 p-5">

                <p className="mb-4 text-sm font-semibold text-slate-700">
                  Profile Picture
                </p>

                <div className="flex flex-col items-center gap-4 sm:flex-row">

                  {picture ? (
                    <img
                      src={picture}
                      alt="Preview"
                      className="h-24 w-24 rounded-2xl object-cover ring-4 ring-white shadow"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-orange-100 text-3xl font-bold text-orange-600">
                      {getInitials()}
                    </div>
                  )}

                  <div>

                    <label className="inline-flex cursor-pointer rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">

                      Upload Photo

                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />

                    </label>

                    <p className="mt-2 text-xs text-slate-500">
                      JPG, PNG or other image formats.
                    </p>

                  </div>

                </div>

              </div>

              {/* FORM FIELDS */}
              <div className="grid gap-5 sm:grid-cols-2">

                <FormInput
                  label="Department"
                  value={department}
                  onChange={setDepartment}
                  placeholder="Enter department"
                />

                <FormInput
                  label="Designation"
                  value={designation}
                  onChange={setDesignation}
                  placeholder="Enter designation"
                />

                <FormInput
                  label="Phone"
                  value={phone}
                  onChange={setPhone}
                  placeholder="Enter phone number"
                />

                <FormInput
                  label="Cost Center"
                  value={costCenter}
                  onChange={setCostCenter}
                  placeholder="Enter cost center"
                />

                <FormInput
                  label="Date of Birth"
                  type="date"
                  value={dob}
                  onChange={setDob}
                  placeholder=""
                />

              </div>

            </div>

            {/* MODAL FOOTER */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-5 sm:flex-row sm:justify-end sm:px-7">

              <button
                onClick={() => setEditOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                onClick={handleUpdateProfile}
                className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600"
              >
                Save Changes
              </button>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}


/* ================= INFO CARD ================= */

function InfoCard({ label, value, icon }) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-orange-200 hover:bg-orange-50/50">

      <div className="flex items-start gap-3">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
          {icon}
        </div>

        <div className="min-w-0">

          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-semibold text-slate-800">
            {value}
          </p>

        </div>

      </div>
    </div>
  );
}


/* ================= STAT CARD ================= */

function StatCard({ title, value, icon }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </p>

        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-xl">
          {icon}
        </div>

      </div>
    </div>
  );
}


/* ================= FORM INPUT ================= */

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
      />

    </div>
  );
}


/* ================= PASSWORD INPUT ================= */

function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
      />

    </div>
  );
}
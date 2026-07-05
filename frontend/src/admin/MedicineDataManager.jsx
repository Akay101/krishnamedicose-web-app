import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileSpreadsheet,
  Upload,
  Users,
  ShieldCheck,
  Mail,
  Phone,
  Calendar,
  IndianRupee,
  Lock,
  Search,
  RefreshCw,
} from "lucide-react";
import api from "../utils/api";
import { useModal } from "../context/ModalContext";

export default function MedicineDataManager() {
  const { showModal } = useModal();
  const [purchases, setPurchases] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalPurchases: 0,
    totalRevenue: 0,
    activeSessions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [search, setSearch] = useState("");
  const [sendEmailMap, setSendEmailMap] = useState({});

  // Fetch Purchases list and Analytics stats
  const fetchData = async () => {
    try {
      const [purchasesResp, analyticsResp] = await Promise.all([
        api.get("/medicine-bundle/purchases"),
        api.get("/medicine-bundle/analytics"),
      ]);
      setPurchases(purchasesResp.data);
      setAnalytics(analyticsResp.data);
    } catch (err) {
      console.error("Failed to fetch data for medicine bundle manager:", err);
      showModal({
        title: "Fetch Error",
        message: "Could not retrieve medicine data bundle statistics.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle CSV file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
      showModal({
        title: "Invalid File Format",
        message: "Please select a valid CSV file (.csv) to upload.",
        type: "error",
      });
    }
  };

  // Upload new CSV dataset
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    showModal({
      title: "Confirm Dataset Update",
      message:
        "Uploading this file will replace the active medicine bundle database. All customers will instantly receive an automated email notification regarding this update. Do you wish to proceed?",
      type: "confirm",
      confirmText: "Upload & Notify",
      onConfirm: async () => {
        setUploading(true);
        const data = new FormData();
        data.append("file", selectedFile);

        try {
          const resp = await api.post("/medicine-bundle/upload", data, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          setSelectedFile(null);
          showModal({
            title: "Upload Successful",
            message:
              resp.data.message || "Dataset updated and customers notified!",
            type: "success",
          });
          fetchData();
        } catch (err) {
          console.error("Failed to upload CSV:", err);
          showModal({
            title: "Upload Failed",
            message:
              err.response?.data?.message || "Failed to upload dataset file.",
            type: "error",
          });
        } finally {
          setUploading(false);
        }
      },
    });
  };
  const handleGenerateCode = async (purchaseId) => {
    const emailCode = sendEmailMap[purchaseId] !== false;
    try {
      const resp = await api.post("/medicine-bundle/generate-activation-code", {
        purchaseId,
        sendEmail: emailCode,
      });

      showModal({
        title: "Activation Code Generated",
        message: `Code: ${resp.data.code}${emailCode ? " (Sent to user email address successfully)" : ""}`,
        type: "success",
      });
      fetchData();
    } catch (err) {
      console.error(err);
      showModal({
        title: "Error",
        message: err.response?.data?.message || "Failed to generate code.",
        type: "error",
      });
    }
  };

  const handleActivateManually = async (purchaseId) => {
    showModal({
      title: "Confirm Manual Activation",
      message:
        "Are you sure you want to activate this user manually? They will instantly gain access without needing to enter an activation code.",
      type: "confirm",
      confirmText: "Activate User",
      onConfirm: async () => {
        try {
          await api.post("/medicine-bundle/activate-manually", { purchaseId });
          showModal({
            title: "User Activated",
            message: "User account has been activated successfully.",
            type: "success",
          });
          fetchData();
        } catch (err) {
          console.error(err);
          showModal({
            title: "Error",
            message: err.response?.data?.message || "Failed to activate user.",
            type: "error",
          });
        }
      },
    });
  };

  const handleDeactivate = async (purchaseId) => {
    showModal({
      title: "Confirm Deactivation",
      message:
        "Are you sure you want to deactivate this user? Their active session will be terminated instantly and they will lose access until activated again.",
      type: "confirm",
      confirmText: "Deactivate User",
      onConfirm: async () => {
        try {
          await api.post("/medicine-bundle/deactivate", { purchaseId });
          showModal({
            title: "User Deactivated",
            message: "User access has been successfully revoked.",
            type: "success",
          });
          fetchData();
        } catch (err) {
          console.error(err);
          showModal({
            title: "Error",
            message:
              err.response?.data?.message || "Failed to deactivate user.",
            type: "error",
          });
        }
      },
    });
  };
  // Filter purchases by search query
  const filteredPurchases = purchases.filter((item) => {
    return (
      (item.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.mobile || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.orderId || "").toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black font-outfit text-slate-900 flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-teal-650 shrink-0" />
            Medicine Dataset Manager
          </h1>
          <p className="text-slate-500 font-bold text-sm mt-1">
            Manage your Top selling products CSV bundle, view customer session
            analytics, and release updates.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="p-4 bg-white border border-slate-200 rounded-2xl text-teal-650 hover:bg-slate-50 shadow-sm flex items-center gap-2 font-bold text-sm select-none active:scale-95 transition-all self-start md:self-auto"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Data
        </button>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Purchases Card */}
        <div className="bg-white border border-slate-200/80 rounded-[2rem] p-8 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 bg-teal-50 border border-teal-100 rounded-2xl flex items-center justify-center text-teal-600 shrink-0">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-450 uppercase tracking-widest">
              Total Sales
            </p>
            <h3 className="text-3xl font-black font-outfit text-slate-900 mt-1">
              {analytics.totalPurchases}
            </h3>
            <p className="text-xs text-slate-400 font-bold">Paid purchases</p>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-white border border-slate-200/80 rounded-[2rem] p-8 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
            <IndianRupee className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-450 uppercase tracking-widest">
              Total Revenue
            </p>
            <h3 className="text-3xl font-black font-outfit text-slate-900 mt-1">
              ₹{analytics.totalRevenue}
            </h3>
            <p className="text-xs text-slate-400 font-bold">
              Gross income generated
            </p>
          </div>
        </div>

        {/* Active Sessions Card */}
        <div className="bg-white border border-slate-200/80 rounded-[2rem] p-8 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-650 shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-450 uppercase tracking-widest">
              Active Sessions
            </p>
            <h3 className="text-3xl font-black font-outfit text-slate-900 mt-1">
              {analytics.activeSessions}
            </h3>
            <p className="text-xs text-slate-400 font-bold">
              Devices logged in currently
            </p>
          </div>
        </div>
      </div>

      {/* CSV Dataset Uploader */}
      <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-8 lg:p-10 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold font-outfit text-slate-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-teal-650" />
            Release Dataset Update
          </h2>
          <p className="text-xs text-slate-400 font-bold mt-1">
            Upload an updated CSV file to replace the dataset served on the user
            secure viewer portal. All paid customers will be emailed
            immediately.
          </p>
        </div>

        <form
          onSubmit={handleUploadSubmit}
          className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center"
        >
          <div className="md:col-span-8">
            <div className="relative border-2 border-dashed border-slate-200 hover:border-teal-400 bg-slate-50/50 rounded-2xl p-6 transition-all duration-300">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex items-center gap-4">
                <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl text-teal-600">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {selectedFile
                      ? selectedFile.name
                      : "Choose dataset CSV file"}
                  </h4>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {selectedFile
                      ? `${(selectedFile.size / 1024).toFixed(2)} KB`
                      : "Click or drag a .csv format file here"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-4 h-full">
            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="w-full h-full min-h-[4rem] bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] shadow-md shadow-teal-600/10"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Push Update</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Customer Purchases List */}
      <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-8 lg:p-10 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-outfit text-slate-900">
              Paid Customers
            </h2>
            <p className="text-xs text-slate-450 font-bold mt-1">
              List of all individuals who have purchased and unlocked dataset
              access.
            </p>
          </div>

          <div className="relative group w-full sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-650 transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:border-teal-500 focus:bg-white transition-all font-bold text-slate-800 text-xs"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-10 h-10 text-teal-600 animate-spin" />
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="text-center py-20 text-slate-450 font-bold text-sm">
            No customers found matching the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs font-bold text-slate-700">
              <thead className="bg-slate-50 uppercase tracking-widest text-[10px] text-slate-450 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Order Details</th>
                  <th className="px-6 py-4 text-center">Status / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPurchases.map((purchase) => {
                  const isPending = purchase.paymentStatus === "pending";
                  const isSessionActive =
                    purchase.activeSessionId &&
                    purchase.sessionExpiresAt &&
                    new Date(purchase.sessionExpiresAt) > new Date();
                  return (
                    <tr
                      key={purchase._id}
                      className={`transition-colors ${isPending ? "bg-amber-50/20 hover:bg-amber-50/40 font-medium" : "hover:bg-slate-50/50"}`}
                    >
                      <td className="px-6 py-4">
                        <p className="font-black text-slate-900 text-sm font-outfit">
                          {purchase.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold font-mono mt-0.5">
                          {purchase.orderId}
                        </p>
                        {purchase.activationCode && (
                          <p className="text-[10px] text-teal-650 font-black font-mono mt-1 px-1.5 py-0.5 bg-teal-50 border border-teal-100 rounded inline-block">
                            Code: {purchase.activationCode}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        <p className="flex items-center gap-2 text-slate-650">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{purchase.email}</span>
                        </p>
                        <p className="flex items-center gap-2 text-slate-650">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{purchase.mobile}</span>
                        </p>
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        <p className="text-teal-600 font-extrabold text-sm">
                          ₹{purchase.amount} INR
                        </p>
                        {isPending ? (
                          <span className="inline-block bg-amber-100 text-amber-800 text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md">
                            Pending Activation
                          </span>
                        ) : (
                          <p className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                            <Calendar className="w-3.5 h-3.5 text-slate-350 shrink-0" />
                            <span>
                              Paid{" "}
                              {new Date(
                                purchase.paidAt || purchase.createdAt,
                              ).toLocaleDateString()}
                            </span>
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isPending ? (
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <div className="flex flex-col items-center gap-1">
                              <button
                                onClick={() => handleGenerateCode(purchase._id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] uppercase font-black tracking-wider shadow-sm active:scale-95 transition-all w-28 text-center"
                              >
                                Generate Code
                              </button>
                              <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-450 font-bold select-none mt-1">
                                <input
                                  type="checkbox"
                                  checked={sendEmailMap[purchase._id] !== false}
                                  onChange={(e) =>
                                    setSendEmailMap({
                                      ...sendEmailMap,
                                      [purchase._id]: e.target.checked,
                                    })
                                  }
                                  className="rounded text-teal-600 focus:ring-teal-500 border-slate-300 w-3 h-3"
                                />
                                <span>Email Code</span>
                              </label>
                            </div>
                            <button
                              onClick={() =>
                                handleActivateManually(purchase._id)
                              }
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] uppercase font-black tracking-wider shadow-sm active:scale-95 transition-all w-28 text-center"
                            >
                              Activate Manually
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-extrabold ${
                                isSessionActive
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              {isSessionActive ? (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>Logged In</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>Offline</span>
                                </>
                              )}
                            </span>
                            <button
                              onClick={() => handleDeactivate(purchase._id)}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] uppercase font-black tracking-wider shadow-sm active:scale-95 transition-all w-24 text-center"
                            >
                              Deactivate
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

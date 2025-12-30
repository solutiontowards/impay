import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getWalletBalance,
  createPaymentOrderForWallet,
  checkOrderStatus,
  getRecentTransactions,
  submitOfflineRequest,
} from "../../api/wallet";
import {
  Wallet as WalletIcon,
  IndianRupee,
  Loader2,
  AlertCircle,
  Receipt,
  ArrowUpCircle,
  ArrowDownCircle,
  PlusCircle,
  XCircle,
  QrCode,
  CheckCircle,
  Clock,
  Phone,
  Zap,
} from "lucide-react";
import Swal from "sweetalert2";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

/* ------------------ STATIC BANKS ------------------ */
const BANKS = [
  { id: "sbi", name: "State Bank of India", qr: "/qrcode/canara.png" },

];

const Wallet = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  /* ------------------ STATE ------------------ */
  const [activeTab, setActiveTab] = useState("online");

  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);

  // Online
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Offline
  const [bank, setBank] = useState("");
  const [utr, setUtr] = useState("");
  const [date, setDate] = useState("");
  const [mode, setMode] = useState("UPI");

  const selectedBank = BANKS.find((b) => b.id === bank);

  /* ------------------ FETCH DATA ------------------ */
  const fetchWalletBalance = async () => {
    try {
      const { data } = await getWalletBalance();
      if (data.ok) setBalance(data.balance);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletTransactions = async () => {
    try {
      const { data } = await getRecentTransactions();
      if (data.ok) setTransactions(data.transactions || []);
    } catch (e) {
      console.error(e);
    }
  };

  /* ------------------ VERIFY PAYMENT ------------------ */
  const verifyPaymentRedirect = async (orderId) => {
    if (!orderId || verifying) return;
    setVerifying(true);
    navigate("/retailer/wallet", { replace: true });

    Swal.fire({
      title: "Verifying Payment...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const { data } = await checkOrderStatus({ order_id: orderId });
      Swal.close();

      if (data.ok && data.order.status === "Success") {
        Swal.fire("Success", "Wallet recharged successfully", "success");
        fetchWalletBalance();
        fetchWalletTransactions();
      } else {
        Swal.fire("Payment Failed", "Transaction not completed", "error");
      }
    } catch {
      Swal.fire("Error", "Verification failed", "error");
    } finally {
      setVerifying(false);
    }
  };

  /* ------------------ ONLINE ADD MONEY ------------------ */
  const handleAddMoney = async (e) => {
    e.preventDefault();
    if (+rechargeAmount < 1) {
      Swal.fire("Invalid Amount", "Minimum ₹1 required", "warning");
      return;
    }

    setIsProcessing(true);
    try {
      const { data } = await createPaymentOrderForWallet({
        amount: rechargeAmount,
      });
      window.location.href = data.payment_url;
    } catch {
      Swal.fire("Error", "Payment initiation failed", "error");
      setIsProcessing(false);
    }
  };

  /* ------------------ OFFLINE SUBMIT ------------------ */
  const handleOfflineSubmit = async (e) => {
    e.preventDefault();
    if (Number(rechargeAmount) < 1) {
      Swal.fire("Invalid Amount", "Minimum amount is ₹1", "error");
      return;
    }

    if (!bank || !rechargeAmount || !utr || !date) {
      Swal.fire("Missing Fields", "All fields are required", "warning");
      return;
    }

    setIsProcessing(true);

    try {
      const { data } = await submitOfflineRequest({
        amount: rechargeAmount,
        bank,
        utr,
        date,
        mode,
      });

      if (data.ok) {
        Swal.fire("Offline Request Submitted", "Your payment will be verified shortly", "success");
        setBank("");
        setRechargeAmount("");
        setUtr("");
        setDate("");
      }
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "Submission failed", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  /* ------------------ INIT ------------------ */
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(location.search);
    if (params.has("order_id")) {
      verifyPaymentRedirect(params.get("order_id"));
    } else {
      fetchWalletBalance();
      fetchWalletTransactions();
    }
  }, [user, location.search]);

  /* ------------------ TRANSACTION DESC ------------------ */
  const getTransactionDescription = (meta) => {
    if (typeof meta === "string") return "Wallet Transaction";
    if (meta?.reason) return meta.reason;
    return "Transaction";
  };

  /* ============================ UI ============================ */
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8 px-4">
      <div className="w-full mx-auto space-y-10">

        {/* WALLET OVERVIEW */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid lg:grid-cols-3 gap-8"
        >
          <div>
            {/* BALANCE CARD */}
            <div className="bg-gradient-to-br max-h-60 from-blue-600 via-indigo-600 to-blue-800 text-white p-8 rounded-3xl shadow-2xl">
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-80">Wallet Balance</span>
                <WalletIcon />
              </div>

              {loading ? (
                <Loader2 className="animate-spin mt-8" />
              ) : (
                <h1 className="text-5xl font-bold mt-6">
                  ₹{balance.toFixed(2)}
                </h1>
              )}

              {!loading && balance < 99 && (
                <div className="mt-6 flex items-center gap-2 bg-yellow-400/20 text-yellow-200 px-3 py-2 rounded-lg text-xs">
                  <AlertCircle size={16} /> Low Balance — Top up soon
                </div>
              )}
            </div>


            <div className="border rounded-xl shadow-2xl bg-yellow-50 p-5 space-y-4 mt-10 md:block hidden">
              {/* Header */}
              <div className="flex items-center gap-2">
                <AlertCircle className="text-yellow-600" size={20} />
                <h3 className="font-semibold text-gray-800">
                  Wallet Recharge Instructions
                </h3>
              </div>

              {/* Content */}
              <div className="space-y-4 text-sm text-gray-700">
                {/* Online */}
                <div>
                  <div className="flex items-center gap-2 font-medium text-gray-800">
                    <CheckCircle size={16} className="text-green-600" />
                    <span>1. Online (Realtime Payment)</span>
                  </div>

                  <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-600">
                    <li>Enter the amount and click the <strong>Add Money</strong> button.</li>
                    <li>Complete payment using UPI and wait for payment success.</li>
                    <li>Once payment is successful, verification happens automatically.</li>
                    <li>Wallet balance will be credited in real time.</li>
                    <li>
                      Do <strong>not refresh</strong> the page until payment verification is complete.
                    </li>
                  </ul>
                </div>

                {/* Offline */}
                <div>
                  <div className="flex items-center gap-2 font-medium text-gray-800">
                    <Clock size={16} className="text-blue-600" />
                    <span>2. Offline (Manual Verification)</span>
                  </div>

                  <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-600">
                    <li>Select a bank from the list (multiple banks available).</li>
                    <li>The selected bank’s QR code will be shown on the right side.</li>
                    <li>Pay using the QR code through any UPI app.</li>
                    <li>
                      After successful payment, enter the <strong>Amount</strong>, <strong>UTR Number</strong>,
                      <strong> Payment Date</strong>, and <strong>Payment Mode</strong>.
                    </li>
                    <li>
                      Submit the request. Our team will manually verify and credit your wallet
                      within <strong>24 hours</strong>.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Support */}
              <div className="pt-3 border-t text-sm text-gray-700 flex items-center gap-2">
                <Phone size={16} className="text-gray-500" />
                <span>
                  For any query, contact our team at{" "}
                  <a
                    href="tel:+919919918196"
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    +91 9919918196
                  </a>
                </span>
              </div>
            </div>
          </div>


          {/* ADD MONEY CARD */}
          <div className="lg:col-span-2 bg-white rounded-3xl h-max shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <PlusCircle className="text-blue-600" /> Add Money
            </h2>

            {/* TABS */}
            <div className="bg-gray-100 rounded-xl p-1 mb-6 flex shadow-inner">
              {["online", "offline"].map((t) => {
                const isActive = activeTab === t;

                return (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`relative flex-1 py-2.5 rounded-lg font-semibold md:text-md text-sm transition-all duration-200
          ${isActive
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                      }`}
                  >
                    {/* Active Indicator */}
                    {isActive && (
                      <span className="absolute inset-x-0 -bottom-1 mx-auto h-1 w-10 rounded-full bg-blue-600" />
                    )}

                    {t === "online" ? (
                      <span className="flex items-center justify-center gap-2">
                        <Zap size={16} />
                        Online (Realtime)
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Clock size={16} />
                        Offline Request
                      </span>
                    )}
                  </button>
                );
              })}
            </div>


            {/* ONLINE */}
            {activeTab === "online" && (
              <form onSubmit={handleAddMoney} className="space-y-6">
                <div className="flex gap-3">
                  {[100, 200, 500, 1000].map((v) => (
                    <button
                      type="button"
                      key={v}
                      onClick={() => setRechargeAmount(v)}
                      className="flex-1 py-3 border rounded-xl"
                    >
                      ₹{v}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    className="w-full pl-12 py-4 border rounded-xl"
                    placeholder="Enter amount"
                  />
                </div>

                <button
                  disabled={isProcessing}
                  className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold"
                >
                  {isProcessing ? "Processing..." : "Add Money"}
                </button>


                
              </form>
              
            )}

            {/* OFFLINE */}
            {activeTab === "offline" && (
              <form
                onSubmit={handleOfflineSubmit}
                className="grid md:grid-cols-2 gap-6"
              >
                {/* LEFT : FORM */}
                <div className="space-y-5">
                  {/* Bank Select */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Select Bank
                    </label>
                    <select
                      value={bank}
                      onChange={(e) => setBank(e.target.value)}
                      className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400"

                    >
                      <option value="">Choose a bank</option>
                      {BANKS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Amount */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Amount (₹)
                    </label>
                    <input
                      type="text"
                      placeholder="Enter amount"
                      value={rechargeAmount}
                      onChange={(e) => {
                        if (/^\d*$/.test(e.target.value)) {
                          setRechargeAmount(e.target.value);
                        }
                      }}
                      className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400"

                    />
                  </div>

                  {/* UTR */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      UTR / Transaction Reference Number
                    </label>
                    <input
                      type="text"
                      placeholder="Enter UTR number"
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                      className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400"

                    />
                  </div>

                  {/* Date */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400"

                    />
                  </div>

                  {/* Mode */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Payment Mode
                    </label>
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value)}
                      className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                      <option value="UPI">UPI</option>
                      <option value="IMPS">IMPS</option>
                      <option value="NEFT">NEFT</option>
                    </select>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className={`w-full py-4 text-white rounded-xl font-semibold transition ${
                      isProcessing ? "bg-gray-400 cursor-not-allowed" : "bg-[#2A2185] hover:bg-blue-800"
                    }`}
                  >
                    {isProcessing ? "Submitting..." : "Submit Offline Payment Request"}
                  </button>
                </div>

                {/* RIGHT : QR + INFO */}
                <div className="flex flex-col items-center justify-center border rounded-xl p-6 bg-white">
                  {selectedBank ? (
                    <>
                      {/* QR */}
                      <img
                        src={selectedBank.qr}
                        alt="UPI QR Code"
                        className="w-48 mb-4"
                      />

                      {/* Instructions */}
                      <div className="text-center space-y-2">
                        <p className="font-semibold text-gray-800">
                          Scan the QR code and complete the payment
                        </p>

                        <p className="text-sm text-gray-500">
                          After payment, please wait up to{" "}
                          <span className="font-medium">24 hours</span>. We will verify the
                          transaction and credit the amount shortly.
                        </p>

                        {/* Support */}
                        <p className="text-sm text-gray-600 mt-2">
                          For any query, contact our team at <br />
                          <a
                            href="tel:+919919918196"
                            className="font-semibold text-blue-600 hover:underline"
                          >
                            +91 9919918196
                          </a>
                        </p>
                      </div>

                      {/* UPI ID */}
                      {selectedBank.upiId && (
                        <div className="mt-4 w-full">
                          <p className="text-xs text-gray-500 mb-1 text-center">
                            Or pay using UPI ID
                          </p>

                          <div className="flex items-center justify-between border rounded-lg px-3 py-2 bg-gray-50">
                            <span className="text-sm font-medium text-gray-700 truncate">
                              {selectedBank.upiId}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                navigator.clipboard.writeText(selectedBank.upiId)
                              }
                              className="text-xs font-semibold text-blue-600 hover:underline"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-400 text-center flex flex-col items-center">
                      <QrCode size={80} />
                      <p className="mt-3 font-medium text-gray-600">
                        Select a bank to view the QR code
                      </p>
                    </div>
                  )}
                </div>
              </form>

            )}
          </div>
        </motion.div>

        {/* 🔥 RECENT TRANSACTIONS — SAME AS BEFORE */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Receipt className="text-blue-600" />
              </div>
              <h2 className="text-xl font-bold">Recent Transactions</h2>
            </div>
            <Link to="/retailer/transaction" className="text-blue-600 font-semibold">
              View All
            </Link>
          </div>

          {transactions.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500 text-xs">
                  <th className="py-3 px-4 text-left">Details</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx._id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex gap-3">
                        {tx.type === "credit" ? (
                          <ArrowDownCircle className="text-green-600" />
                        ) : tx.type === "debit" ? (
                          <ArrowUpCircle className="text-red-600" />
                        ) : (
                          <XCircle className="text-gray-400" />
                        )}
                        <div>
                          <p className="font-medium">
                            {getTransactionDescription(tx.meta)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(tx.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={`py-4 px-4 text-right font-semibold ${tx.type === "credit" ? "text-green-600" : "text-red-600"
                      }`}>
                      {tx.type === "credit" ? "+" : "-"}₹{tx.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-400 py-10">
              No recent transactions found
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Wallet;

// Dropdown chọn admin để gán khiếu nại
const AdminAssignSelect: React.FC<{
  value?: string;
  onChange: (adminId: string) => void;
  currentUserId?: string;
}> = ({ value, onChange, currentUserId }) => {
  const [admins, setAdmins] = React.useState<AdminUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    setLoading(true);
    getUsers({ role: 'admin', isActive: true, limit: 100 }).then(res => {
      setAdmins(res.users);
      setLoading(false);
    });
  }, []);
  if (loading) return <select disabled className="flex-1 rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm font-medium"><option>Đang tải admin...</option></select>;
  return (
    <select value={value ?? ""} onChange={e => onChange(e.target.value)} className="flex-1 rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm font-medium">
      <option value="">Chưa gán</option>
      {admins.map(a => (
        <option key={a._id} value={a._id}>
          {a.name || a.email || a._id}{currentUserId && a._id === currentUserId ? ' (Bạn)' : ''}
        </option>
      ))}
    </select>
  );
};
// Hiển thị tên người tạo ghi chú nội bộ
const NoteUserName: React.FC<{ userId: string }> = ({ userId }) => {
  const [user, setUser] = React.useState<AdminUser | null>(null);
  React.useEffect(() => {
    let mounted = true;
    getUserById(userId).then(u => { if (mounted) setUser(u); });
    return () => { mounted = false; };
  }, [userId]);
  if (!user) return <div className="font-semibold text-sm text-gray-900 animate-pulse">Đang tải...</div>;
  return (
    <div className="font-semibold text-sm text-gray-900">
      {user.name || user.email || user._id}
      {user.email ? <span className="ml-1 text-xs text-gray-400">({user.email})</span> : null}
    </div>
  );
};
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { getAllDisputesForAdmin, AdminDispute, updateDisputeStatus, assignDisputeToAdmin, updateDisputeSeverity, addDisputeInternalNote, getDisputeByIdForAdmin, makeAdminDecision, DisputeEvidence } from "../../services/complaint.service";
import { getUserById, AdminUser, getUsers } from "../../services/admin.service";
import Notification from "../../components/Notification";

type DisputeCategory = "service_quality" | "payment_issue" | "schedule_conflict" | "unprofessional_behavior" | "safety_concern" | "other";
type DisputeSeverity = "low" | "medium" | "high" | "critical";
type DisputeStatus = "pending" | "under_review" | "awaiting_response" | "resolved" | "rejected" | "withdrawn";
type UserRole = "careseeker" | "caregiver";

type EvidenceType = "image" | "pdf" | "docx" | "video" | "other";

const CATEGORY_LABEL: Record<DisputeCategory, string> = {
  service_quality: "Chất lượng dịch vụ",
  payment_issue: "Thanh toán",
  schedule_conflict: "Lịch hẹn",
  unprofessional_behavior: "Ứng xử",
  safety_concern: "An toàn",
  other: "Khác",
};

const SEVERITY_LABEL: Record<DisputeSeverity, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  critical: "Nghiêm trọng",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ xử lý",
  under_review: "Đang xem xét",
  awaiting_response: "Chờ phản hồi",
  resolved: "Đã giải quyết",
  rejected: "Từ chối",
  withdrawn: "Đã rút",
  investigating: "Đang điều tra",
};

function prettifyStatus(status: string): string {
  if (!status) return "Không xác định";
  // Replace underscores with spaces, capitalize first letter of each word
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const ALL_STATUSES: DisputeStatus[] = ["pending", "under_review", "awaiting_response", "resolved", "rejected", "withdrawn"];

function classNames(...c: Array<string | false | undefined>) {
  return c.filter(Boolean).join(" ");
}

const SeverityBadge: React.FC<{ value: DisputeSeverity }> = ({ value }) => {
  const map: Record<DisputeSeverity, string> = {
    low: "bg-gray-100 text-gray-700",
    medium: "bg-amber-100 text-amber-700",
    high: "bg-red-100 text-red-700",
    critical: "bg-purple-100 text-purple-700",
  };
  return <span className={classNames("inline-flex rounded-full px-2 py-1 text-xs font-medium", map[value])}>{SEVERITY_LABEL[value]}</span>;
};

const StatusBadge: React.FC<{ value?: string }> = ({ value }) => {
  // Map known statuses to color classes, fallback to gray
  const map: Record<string, { className: string; style: any }> = {
    pending: { className: "bg-yellow-100 text-yellow-700", style: {} },
    under_review: { className: "text-white", style: { backgroundColor: "#70C1F1" } },
    awaiting_response: { className: "bg-amber-100 text-amber-700", style: {} },
    resolved: { className: "bg-emerald-100 text-emerald-700", style: {} },
    rejected: { className: "bg-slate-100 text-slate-700", style: {} },
    withdrawn: { className: "bg-gray-100 text-gray-700", style: {} },
    investigating: { className: "bg-blue-100 text-blue-700", style: {} },
  };
  const label = value && STATUS_LABEL[value] ? STATUS_LABEL[value] : prettifyStatus(value || "");
  const config = (value && map[value]) ? map[value] : { className: "bg-gray-200 text-gray-400", style: {} };
  return (
    <span className={classNames("inline-flex rounded-full px-2 py-1 text-xs font-medium", config.className)} style={config.style}>
      {label}
    </span>
  );
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode }> = ({ title, value, icon }) => {
  return (
    <div className="rounded-xl bg-white p-4 shadow flex items-start gap-3">
      <div className="text-indigo-600">{icon}</div>
      <div>
        <div className="text-sm text-gray-500">{title}</div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
      </div>
    </div>
  );
};

interface DisputeDetailModalProps {
  open: boolean;
  dispute: AdminDispute | null;
  loading?: boolean;
  onClose: () => void;
  onChangeStatus: (id: string, status: DisputeStatus, note?: string, allowComplainantResponse?: boolean, allowRespondentResponse?: boolean) => void;
  onAssign: (id: string, assignee?: string) => void;
  onChangeSeverity: (id: string, severity: DisputeSeverity) => void;
  onChangeCategory: (id: string, category: DisputeCategory) => void;
  onAddEvidence: (id: string, e: { filename: string; type: EvidenceType; url?: string }) => void;
  onAddNote: (id: string, note: string) => void;
  onMakeDecision: (id: string, decision: {
    decision: string;
    resolution: string;
    refundAmount?: number;
    compensationAmount?: number;
    actions?: string[];
    notes?: string;
  }) => void;
}

const DisputeDetailModal: React.FC<DisputeDetailModalProps> = ({ open, dispute, loading, onClose, onChangeStatus, onAssign, onAddNote, onMakeDecision }) => {
  const [status, setStatus] = useState<DisputeStatus>("pending");
  const [assignee, setAssignee] = useState<string | undefined>(undefined);
  /* Unused state variables - commented out
  const [severity, setSeverity] = useState<DisputeSeverity>("low");
  const [category, setCategory] = useState<DisputeCategory>("other");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<EvidenceType>("image");
  const [fileUrl, setFileUrl] = useState("");
  */
  const [note, setNote] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [allowComplainantResponse, setAllowComplainantResponse] = useState(true);
  const [allowRespondentResponse, setAllowRespondentResponse] = useState(true);
  const [previewEvidence, setPreviewEvidence] = useState<DisputeEvidence | null>(null);
  
  // Decision states
  const [adminDecision, setAdminDecision] = useState<'favor_complainant' | 'favor_respondent' | 'partial_favor'>('favor_complainant');
  const [decisionResolution, setDecisionResolution] = useState("");
  const [paymentAmount, setPaymentAmount] = useState<number | "">("");
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState("");

  useEffect(() => {
    if (dispute) {
      setStatus(dispute.status);
      setAssignee(dispute.assignedTo?._id);
      setAllowComplainantResponse(dispute.allowComplainantResponse);
      setAllowRespondentResponse(dispute.allowRespondentResponse);
      setStatusNote("");
    }
  }, [dispute]);

  if (!open) return null;
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl flex flex-col items-center justify-center p-10">
          <div className="animate-spin rounded-full border-4 border-gray-200 h-12 w-12 mb-4" style={{ borderTopColor: '#70C1F1' }}></div>
          <div className="text-gray-600 text-lg font-medium">Đang tải chi tiết tranh chấp...</div>
        </div>
      </div>
    );
  }
  if (!dispute) return null;

  const handleSaveStatus = () => {
    if (status !== dispute.status || statusNote.trim()) {
      onChangeStatus(
        dispute._id, 
        status, 
        statusNote.trim() || undefined,
        allowComplainantResponse,
        allowRespondentResponse
      );
      setStatusNote("");
    }
  };
  const handleSaveAssign = () => onAssign(dispute._id, assignee);
  /* Unused handlers - commented out
  const handleSaveSeverity = () => {
    if (severity !== dispute.severity) onChangeSeverity(dispute._id, severity);
  };
  const handleSaveCategory = () => {
    if (category !== dispute.disputeType) onChangeCategory(dispute._id, category);
  };
  */

  /* Unused - evidence upload removed
  const addEvidence = () => {
    if (!fileName.trim()) return;
    onAddEvidence(dispute._id, { filename: fileName.trim(), type: fileType, url: fileUrl.trim() || undefined });
    setFileName("");
    setFileType("image");
    setFileUrl("");
  };
  */
  const addNote = () => {
    if (!note.trim()) return;
    onAddNote(dispute._id, note.trim());
    setNote("");
  };

  const toggleAction = (action: string) => {
    setSelectedActions(prev => 
      prev.includes(action) 
        ? prev.filter(a => a !== action)
        : [...prev, action]
    );
  };

  const handleMakeDecision = () => {
    if (!decisionResolution.trim()) {
      alert("Vui lòng nhập nội dung giải quyết");
      return;
    }
    onMakeDecision(dispute._id, {
      decision: adminDecision,
      resolution: decisionResolution.trim(),
      refundAmount: paymentAmount === "" ? undefined : Number(paymentAmount),
      actions: selectedActions.length > 0 ? selectedActions : undefined,
      notes: additionalNotes.trim() || undefined
    });
    // Reset form
    setDecisionResolution("");
    setPaymentAmount("");
    setSelectedActions([]);
    setAdditionalNotes("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-6xl max-h-[90vh] rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4" style={{ background: "linear-gradient(to right, #70C1F1, #5AB4E8)" }}>
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-white/20 p-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-white">
                <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Chi tiết tranh chấp #{dispute._id}</h3>
              <p className="text-sm text-white/90">Quản lý và xử lý tranh chấp</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-white hover:bg-white/20 transition-colors" aria-label="Đóng">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3 overflow-y-auto flex-1 bg-gray-50">
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" style={{ color: "#70C1F1" }}>
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
                <h4 className="font-semibold text-gray-900">Thông tin chung</h4>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="rounded-lg p-2" style={{ backgroundColor: "rgba(112, 193, 241, 0.2)" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" style={{ color: "#70C1F1" }}>
                      <path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM8.25 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM10.5 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12.75 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM14.25 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 13.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                      <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-500 uppercase">Booking ID</div>
                    <div className="mt-1 font-semibold text-gray-900">{dispute.booking?._id ?? "—"}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="rounded-lg bg-purple-100 p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-purple-600">
                      <path fillRule="evenodd" d="M5.25 2.25a3 3 0 00-3 3v4.318a3 3 0 00.879 2.121l9.58 9.581c.92.92 2.39 1.186 3.548.428a18.849 18.849 0 005.441-5.44c.758-1.16.492-2.629-.428-3.548l-9.58-9.581a3 3 0 00-2.122-.879H5.25zM6.375 7.5a1.125 1.125 0 100-2.25 1.125 1.125 0 000 2.25z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-500 uppercase">Nhóm tranh chấp</div>
                    <div className="mt-1 font-semibold text-gray-900">{CATEGORY_LABEL[dispute.disputeType]}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="rounded-lg bg-amber-100 p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-amber-600">
                      <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-500 uppercase">Mức độ</div>
                    <div className="mt-1"><SeverityBadge value={dispute.severity} /></div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-blue-600">
                      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-500 uppercase">Người tạo</div>
                    <div className="mt-1 font-semibold text-gray-900">{dispute.complainant.name}</div>
                    <div className="text-xs text-gray-500">{dispute.complainant.role}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="rounded-lg bg-rose-100 p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-rose-600">
                      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-500 uppercase">Đối tượng tranh chấp</div>
                    <div className="mt-1 font-semibold text-gray-900">{dispute.respondent.name}</div>
                    <div className="text-xs text-gray-500">{dispute.respondent.role}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="rounded-lg bg-emerald-100 p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-emerald-600">
                      <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-500 uppercase">Admin phụ trách</div>
                    <div className="mt-1 font-semibold text-gray-900">{dispute.assignedTo?.name ?? "Chưa gán"}</div>
                  </div>
                </div>
                {dispute.refundBankInfo && (
                  <div className="col-span-2">
                    <div className="rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border-2 p-4" style={{ borderColor: "rgba(112, 193, 241, 0.3)" }}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="rounded-lg p-2" style={{ backgroundColor: "rgba(112, 193, 241, 0.2)" }}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" style={{ color: "#70C1F1" }}>
                            <path d="M4.5 3.75a3 3 0 00-3 3v.75h21v-.75a3 3 0 00-3-3h-15z" />
                            <path fillRule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 003 3h15a3 3 0 003-3v-7.5zm-18 3.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="text-xs font-semibold text-gray-700 uppercase">Thông tin ngân hàng hoàn tiền</div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="text-gray-500 font-medium">Chủ tài khoản</div>
                          <div className="text-gray-900 font-semibold mt-1">{dispute.refundBankInfo.accountName}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 font-medium">Số tài khoản</div>
                          <div className="text-gray-900 font-semibold mt-1">{dispute.refundBankInfo.accountNumber}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 font-medium">Ngân hàng</div>
                          <div className="text-gray-900 font-semibold mt-1">{dispute.refundBankInfo.bankName}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 font-medium">Chi nhánh</div>
                          <div className="text-gray-900 font-semibold mt-1">{dispute.refundBankInfo.branch}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" style={{ color: "#70C1F1" }}>
                  <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clipRule="evenodd" />
                </svg>
                <h4 className="font-semibold text-gray-900">Nội dung tranh chấp</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase mb-1">Tóm tắt</div>
                  <div className="text-sm font-medium text-gray-900 bg-gray-50 rounded-lg p-3">{dispute.title}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase mb-1">Chi tiết</div>
                  <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">{dispute.description}</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" style={{ color: "#70C1F1" }}>
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                </svg>
                <h4 className="font-semibold text-gray-900">Lịch sử xử lý</h4>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-2 bottom-2 w-0.5" style={{ background: "linear-gradient(to bottom, rgba(112, 193, 241, 0.4), transparent)" }}></div>
                <div className="space-y-4">
                  {dispute.timeline.slice().reverse().map((t, idx) => (
                    <div key={t._id} className="relative flex items-start gap-4">
                      <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-sm`} style={{ backgroundColor: idx === 0 ? "#70C1F1" : "#d1d5db" }}>
                        <span className="h-2 w-2 rounded-full bg-white" />
                      </div>
                      <div className="flex-1 pt-0.5">
                        <div className="text-sm font-medium text-gray-900">{t.description}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{formatDate(t.performedAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" style={{ color: "#70C1F1" }}>
                  <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
                </svg>
                <h4 className="font-semibold text-gray-900">Cập nhật thông tin</h4>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">Trạng thái</label>
                  <div className="flex items-center gap-2">
                    <select value={status} onChange={(e) => setStatus(e.target.value as DisputeStatus)} className="flex-1 rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm font-medium focus:outline-none transition-colors" style={{ borderColor: "#70C1F1" }}>
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                    <button onClick={handleSaveStatus} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm" style={{ backgroundColor: "#70C1F1" }}>
                      Lưu
                    </button>
                  </div>
                  <div className="mt-3">
                    <textarea
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Ghi chú về thay đổi trạng thái (tùy chọn)..."
                      rows={2}
                      className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm focus:outline-none transition-colors resize-none"
                      style={{ borderColor: "#70C1F1" }}
                    />
                  </div>
                  <div className="mt-3 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowComplainantResponse}
                        onChange={(e) => setAllowComplainantResponse(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                        style={{ accentColor: "#70C1F1" }}
                      />
                      <span className="text-sm text-gray-700">Cho phép người khiếu nại phản hồi</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowRespondentResponse}
                        onChange={(e) => setAllowRespondentResponse(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                        style={{ accentColor: "#70C1F1" }}
                      />
                      <span className="text-sm text-gray-700">Cho phép bên bị khiếu nại phản hồi</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">Admin phụ trách</label>
                  <div className="flex items-center gap-2">
                    <AdminAssignSelect value={assignee} onChange={v => setAssignee(v || undefined)} currentUserId={localStorage.getItem('userId') || undefined} />
                    <button onClick={handleSaveAssign} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm">
                      Gán
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">Nhóm tranh chấp</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={dispute ? CATEGORY_LABEL[dispute.disputeType] : ""}
                      readOnly
                      className="flex-1 rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm font-medium bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none"
                      style={{ borderColor: "#70C1F1" }}
                    />
                  </div>
                </div>
                {/* Đã loại bỏ phần chỉnh mức độ nghiêm trọng theo yêu cầu */}
              </div>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" style={{ color: "#70C1F1" }}>
                  <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
                </svg>
                <h4 className="font-semibold text-gray-900">Minh chứng</h4>
                <span className="ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: "#70C1F1" }}>
                  {dispute.evidence.length}
                </span>
              </div>
              {dispute.evidence.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 mb-4">
                  {dispute.evidence.map(ev => (
                    <div key={ev._id} className="flex items-center gap-3 p-3 rounded-lg border-2 transition-colors bg-gray-50" style={{ borderColor: "rgba(112, 193, 241, 0.3)" }}>
                      {ev.type === 'image' && ev.url && (
                        <img 
                          src={ev.url} 
                          alt={ev.description || "Evidence"}
                          className="h-16 w-16 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                          onClick={() => window.open(ev.url, '_blank')}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">{ev.description || "Mình chứng"}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {ev.type} • {formatDate(ev.uploadedAt)} • <span className="font-medium">{ev.uploadedBy?.role === 'careseeker' ? 'Người khiếu nại' : 'Người bị khiếu nại'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewEvidence(ev)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:opacity-90"
                          style={{ backgroundColor: "#70C1F1" }}
                        >
                          Xem
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mx-auto h-12 w-12 text-gray-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">Chưa có minh chứng nào</p>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" style={{ color: "#70C1F1" }}>
                  <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clipRule="evenodd" />
                </svg>
                <h4 className="font-semibold text-gray-900">Ghi chú nội bộ</h4>
                <span className="ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: "#70C1F1" }}>
                  {dispute.internalNotes.length}
                </span>
              </div>
              {dispute.internalNotes.length > 0 ? (
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {dispute.internalNotes.map(n => (
                    <div key={n._id} className="rounded-lg border-2 border-gray-100 p-3 bg-gradient-to-br from-gray-50 to-white transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: "rgba(112, 193, 241, 0.2)" }}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" style={{ color: "#70C1F1" }}>
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.483 6.483 0 0010 16.5a6.483 6.483 0 004.793-2.11A5.99 5.99 0 0010 12z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <NoteUserName userId={n.addedBy} />
                          <div className="text-xs text-gray-500">{formatDate(n.addedAt)}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 leading-relaxed pl-9">{n.note}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mx-auto h-10 w-10 text-gray-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">Chưa có ghi chú nào</p>
                </div>
              )}
              <div className="space-y-3">
                <textarea 
                  value={note} 
                  onChange={(e) => setNote(e.target.value)} 
                  placeholder="Nhập ghi chú nội bộ..." 
                  className="w-full resize-none rounded-lg border-2 border-gray-200 p-3 text-sm focus:outline-none transition-colors min-h-[100px]"
                  style={{ borderColor: "#70C1F1" }}
                />
                <button 
                  onClick={addNote} 
                  className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm flex items-center justify-center gap-2"
                  style={{ backgroundColor: "#70C1F1" }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M3.505 2.365A41.369 41.369 0 019 2c1.863 0 3.697.124 5.495.365 1.247.167 2.18 1.108 2.435 2.268a4.45 4.45 0 00-.577-.069 43.141 43.141 0 00-4.706 0C9.229 4.696 7.5 6.727 7.5 8.998v2.24c0 1.413.67 2.735 1.76 3.562l-2.98 2.98A.75.75 0 015 17.25v-3.443c-.501-.048-1-.106-1.495-.172C2.033 13.438 1 12.162 1 10.72V5.28c0-1.441 1.033-2.717 2.505-2.914z" />
                    <path d="M14 6c-.762 0-1.52.02-2.271.062C10.157 6.148 9 7.472 9 8.998v2.24c0 1.519 1.147 2.839 2.71 2.935.214.013.428.024.642.034.2.009.385.09.518.224l2.35 2.35a.75.75 0 001.28-.531v-2.07c1.453-.195 2.5-1.463 2.5-2.915V8.998c0-1.526-1.157-2.85-2.729-2.936A41.645 41.645 0 0014 6z" />
                  </svg>
                  Thêm ghi chú
                </button>
              </div>
            </div>

            {/* Decision Section */}
            <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" style={{ color: "#70C1F1" }}>
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM9 11.25a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 17H15a.75.75 0 000-1.5h-4.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 11H9z" clipRule="evenodd" />
                  <path d="M12 7a1 1 0 100-2 1 1 0 000 2z" />
                </svg>
                <h4 className="font-semibold text-gray-900">Đưa ra quyết định</h4>
              </div>
              {dispute.adminDecision?.decision ? (
                <div className="space-y-3">
                  <div className="rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-green-600">
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-semibold text-green-800">Đã có quyết định</span>
                    </div>
                    <div className="text-xs text-green-700 space-y-1">
                      <div><strong>Kết quả:</strong> {dispute.adminDecision.decision === 'favor_complainant' ? 'Ủng hộ người khiếu nại' : dispute.adminDecision.decision === 'favor_respondent' ? 'Ủng hộ người bị khiếu nại' : dispute.adminDecision.decision === 'partial_favor' ? 'Ủng hộ một phần' : 'Bác bỏ'}</div>
                      {dispute.adminDecision.resolution && <div><strong>Giải quyết:</strong> {dispute.adminDecision.resolution}</div>}
                      {dispute.adminDecision.decidedAt && <div><strong>Thời gian:</strong> {formatDate(dispute.adminDecision.decidedAt)}</div>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">Kết quả quyết định</label>
                    <select 
                      value={adminDecision} 
                      onChange={(e) => setAdminDecision(e.target.value as any)} 
                      className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm font-medium focus:outline-none transition-colors"
                      style={{ borderColor: "#70C1F1" }}
                    >
                      <option value="favor_complainant">Ủng hộ người khiếu nại</option>
                      <option value="favor_respondent">Ủng hộ người bị khiếu nại</option>
                      <option value="partial_favor">Ủng hộ một phần</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">Nội dung giải quyết *</label>
                    <textarea 
                      value={decisionResolution} 
                      onChange={(e) => setDecisionResolution(e.target.value)} 
                      placeholder="Mô tả chi tiết cách giải quyết tranh chấp..."
                      rows={4}
                      className="w-full resize-none rounded-lg border-2 border-gray-200 p-3 text-sm focus:outline-none transition-colors"
                      style={{ borderColor: "#70C1F1" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">Số tiền hoàn/bồi thường (VNĐ)</label>
                    <input 
                      type="number" 
                      value={paymentAmount} 
                      onChange={(e) => setPaymentAmount(e.target.value === "" ? "" : Number(e.target.value))} 
                      placeholder="Nhập số tiền cần hoàn trả hoặc bồi thường"
                      className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm font-medium focus:outline-none transition-colors"
                      style={{ borderColor: "#70C1F1" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">Hành động thực hiện</label>
                    <div className="space-y-2">
                      {['warning_issued', 'suspension', 'payment_processed'].map(action => (
                        <label key={action} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedActions.includes(action)}
                            onChange={() => toggleAction(action)}
                            className="w-4 h-4 rounded border-gray-300"
                            style={{ accentColor: "#70C1F1" }}
                          />
                          <span className="text-sm text-gray-700">
                            {action === 'warning_issued' ? 'Cảnh cáo' : 
                             action === 'suspension' ? 'Tạm ngưng' :
                             'Đã xử lý thanh toán'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">Ghi chú</label>
                    <textarea 
                      value={additionalNotes} 
                      onChange={(e) => setAdditionalNotes(e.target.value)} 
                      placeholder="Ghi chú bổ sung..."
                      rows={2}
                      className="w-full resize-none rounded-lg border-2 border-gray-200 p-3 text-sm focus:outline-none transition-colors"
                      style={{ borderColor: "#70C1F1" }}
                    />
                  </div>
                  <button 
                    onClick={handleMakeDecision} 
                    className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm flex items-center justify-center gap-2"
                    style={{ backgroundColor: "#70C1F1" }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                    Xác nhận quyết định
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t px-6 py-4 bg-white">
          <div className="flex items-center gap-3">
            <StatusBadge value={dispute.status} />
            <div className="text-sm text-gray-500">
              Cập nhật lần cuối: <span className="font-medium text-gray-700">{formatDate(dispute.updatedAt)}</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-lg border-2 border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Evidence Preview Modal */}
      {previewEvidence && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setPreviewEvidence(null)}>
          <div className="relative max-w-4xl w-full max-h-[90vh] rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4" style={{ background: "linear-gradient(to right, #70C1F1, #5AB4E8)" }}>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white/20 p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white">
                    <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Chi tiết minh chứng</h3>
                  <p className="text-xs text-white/90">{previewEvidence.type}</p>
                </div>
              </div>
              <button onClick={() => setPreviewEvidence(null)} className="rounded-lg p-2 text-white hover:bg-white/20 transition-colors" aria-label="Đóng">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {previewEvidence.type === 'image' && previewEvidence.url && (
                <div className="mb-6 flex justify-center">
                  <img 
                    src={previewEvidence.url} 
                    alt={previewEvidence.description || "Evidence"}
                    className="max-w-full max-h-[60vh] rounded-lg shadow-lg object-contain"
                  />
                </div>
              )}
              {previewEvidence.type !== 'image' && previewEvidence.url && (
                <div className="mb-6 p-8 bg-white rounded-lg border-2 border-dashed border-gray-300 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mx-auto h-16 w-16 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <p className="mt-4 text-sm font-medium text-gray-700">File {previewEvidence.type.toUpperCase()}</p>
                  <a 
                    href={previewEvidence.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
                    style={{ backgroundColor: "#70C1F1" }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Tải xuống
                  </a>
                </div>
              )}
              <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" style={{ color: "#70C1F1" }}>
                    <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clipRule="evenodd" />
                  </svg>
                  <h4 className="font-semibold text-gray-900">Mô tả</h4>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {previewEvidence.description || "Không có mô tả"}
                </p>
              </div>
              <div className="mt-4 rounded-xl bg-white p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" style={{ color: "#70C1F1" }}>
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                  </svg>
                  <h4 className="font-semibold text-gray-900">Thông tin</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase mb-1">Loại file</div>
                    <div className="text-sm font-semibold text-gray-900">{previewEvidence.type.toUpperCase()}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase mb-1">Thời gian tải lên</div>
                    <div className="text-sm font-semibold text-gray-900">{formatDate(previewEvidence.uploadedAt)}</div>
                  </div>
                </div>
                {previewEvidence.url && (
                  <div className="mt-4">
                    <a 
                      href={previewEvidence.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                      style={{ color: "#70C1F1" }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                      </svg>
                      Mở trong tab mới
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DisputeRow: React.FC<{
  d: AdminDispute;
  onView: (d: AdminDispute) => void;
}> = ({ d, onView }) => {
  // Nếu status hoặc các trường quan trọng bị thiếu, không render row này
  if (!d || !d.status || !d._id || !d.booking) return null;
  return (
    <tr 
      className="border-b last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => onView(d)}
    >
      <td className="px-4 py-3 text-sm text-gray-700">{d._id}</td>
      <td className="px-4 py-3 text-sm text-gray-700">{d.booking._id}</td>
      <td className="px-4 py-3 text-sm text-gray-700">{CATEGORY_LABEL[d.disputeType]}</td>
      <td className="px-4 py-3"><SeverityBadge value={d.severity} /></td>
      <td className="px-4 py-3"><StatusBadge value={d.status} /></td>
      <td className="px-4 py-3 text-sm text-gray-700">
        <div className="font-medium">{d.complainant.name}</div>
        <div className="text-gray-500 capitalize">{d.complainant.role}</div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">
        <div className="text-gray-700">{d.assignedTo?.name ?? "Chưa gán"}</div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">{formatDate(d.updatedAt)}</td>
    </tr>
  );
};

const PAGE_SIZE = 10;

const AdminDisputeManagementPage: React.FC = () => {
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ under_review: 0, resolved: 0, pending: 0 });

  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    message: string;
  }>({
    show: false,
    type: 'info',
    message: ''
  });

  // filters
  const [category, setCategory] = useState<"All" | DisputeCategory>("All");
  const [status, setStatus] = useState<"All" | DisputeStatus>("All");
  const [severity, setSeverity] = useState<"All" | DisputeSeverity>("All");
  const [creator, setCreator] = useState<"All" | UserRole>("All");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  // sorting & pagination
  const [sortKey, setSortKey] = useState<"updatedAt" | "severity">("updatedAt");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState<{ open: boolean; disputeId: string | null }>({ open: false, disputeId: null });
  const [detailDispute, setDetailDispute] = useState<AdminDispute | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: PAGE_SIZE,
      };
      if (status !== "All") params.status = status;
      if (severity !== "All") params.severity = severity;
      if (category !== "All") params.disputeType = category;

      console.log('Fetching disputes with params:', params);
      const response = await getAllDisputesForAdmin(params);
      console.log('Disputes response:', response);
      // Debug: print all dispute statuses
      if (response?.data?.disputes) {
        response.data.disputes.forEach((d: any) => {
          console.log(`[DEBUG] Dispute ${d._id} status:`, d.status);
        });
      }
      setDisputes(response.data.disputes);
      setTotalPages(response.data.pagination.totalPages);
      setTotalCount(response.data.pagination.total);
      // Update stats
      const statistics = response.data.statistics;
      setStats({
        under_review: statistics.byStatus.under_review || 0,
        resolved: statistics.byStatus.resolved || 0,
        pending: statistics.byStatus.pending || 0,
      });
    } catch (error: any) {
      console.error('Dispute fetch error:', error);
      console.error('Error details:', error.response?.data);
      setNotification({
        show: true,
        type: 'error',
        message: error.response?.data?.message || error.message || 'Không thể tải dữ liệu tranh chấp'
      });
      // Set empty data on error to prevent blank page
      setDisputes([]);
      setTotalPages(1);
      setTotalCount(0);
      setStats({ under_review: 0, resolved: 0, pending: 0 });
    } finally {
      setLoading(false);
    }
  }, [page, status, severity, category]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const filtered = useMemo(() => {
    let items = [...disputes];
    
    if (creator !== "All") {
      items = items.filter(d => d.complainant?.role === creator);
    }
    
    if (debounced) {
      items = items.filter(d => {
        const hay = `${d._id} ${d.booking?._id || ''} ${d.complainant?.name || ''} ${d.complainant?.email || ''} ${d.title}`.toLowerCase();
        return hay.includes(debounced);
      });
    }
    
    const sorted = items.sort((a, b) => {
      if (sortKey === "updatedAt") {
        const da = new Date(a.updatedAt).getTime();
        const db = new Date(b.updatedAt).getTime();
        return sortAsc ? da - db : db - da;
      }
      const sevOrder: Record<DisputeSeverity, number> = { low: 0, medium: 1, high: 2, critical: 3 };
      return sortAsc ? sevOrder[a.severity] - sevOrder[b.severity] : sevOrder[b.severity] - sevOrder[a.severity];
    });
    
    return sorted;
  }, [disputes, creator, debounced, sortKey, sortAsc]);

  const pageItems = filtered;

  useEffect(() => { 
    if (page !== 1) setPage(1); 
  }, [category, status, severity, creator, debounced, sortKey, sortAsc]);

  const openDetail = (d: AdminDispute) => setModal({ open: true, disputeId: d._id });
  // Fetch dispute detail when modal opens
  useEffect(() => {
    if (modal.open && modal.disputeId) {
      setDetailLoading(true);
      getDisputeByIdForAdmin(modal.disputeId)
        .then(res => setDetailDispute(res.data))
        .catch(() => setDetailDispute(null))
        .finally(() => setDetailLoading(false));
    } else {
      setDetailDispute(null);
    }
  }, [modal]);

  const changeStatus = async (
    id: string, 
    s: DisputeStatus, 
    note?: string, 
    allowComplainantResponse?: boolean, 
    allowRespondentResponse?: boolean
  ) => {
    try {
      await updateDisputeStatus(id, {
        status: s,
        note,
        allowComplainantResponse,
        allowRespondentResponse
      });
      setNotification({
        show: true,
        type: 'success',
        message: 'Cập nhật trạng thái thành công'
      });
      fetchDisputes();
      // Refresh detail if still open
      if (modal.open && modal.disputeId === id) {
        getDisputeByIdForAdmin(id)
          .then(res => setDetailDispute(res.data))
          .catch(() => {});
      }
    } catch (error: any) {
      setNotification({
        show: true,
        type: 'error',
        message: error.response?.data?.message || 'Không thể cập nhật trạng thái'
      });
    }
  };

  const assignTo = async (id: string, adminId?: string) => {
    if (!adminId) return;
    try {
      const result = await assignDisputeToAdmin(id, adminId);
      console.log('[DEBUG] Dispute after assignment:', result?.data);
      setNotification({
        show: true,
        type: 'success',
        message: 'Phân công thành công'
      });
      fetchDisputes();
    } catch (error: any) {
      setNotification({
        show: true,
        type: 'error',
        message: error.response?.data?.message || 'Không thể phân công'
      });
    }
  };

  const addNote = async (id: string, content: string) => {
    try {
      await addDisputeInternalNote(id, content);
      setNotification({
        show: true,
        type: 'success',
        message: 'Thêm ghi chú thành công'
      });
      fetchDisputes();
    } catch (error: any) {
      setNotification({
        show: true,
        type: 'error',
        message: error.response?.data?.message || 'Không thể thêm ghi chú'
      });
    }
  };

  const changeSeverity = async (id: string, severity: DisputeSeverity) => {
    try {
      await updateDisputeSeverity(id, severity);
      setNotification({
        show: true,
        type: 'success',
        message: 'Cập nhật mức độ thành công'
      });
      fetchDisputes();
    } catch (error: any) {
      setNotification({
        show: true,
        type: 'error',
        message: error.response?.data?.message || 'Không thể cập nhật mức độ'
      });
    }
  };

  const changeCategory = async (_id: string, _category: DisputeCategory) => {
    // API doesn't seem to have endpoint for this, so just show notification
    setNotification({
      show: true,
      type: 'info',
      message: 'Chức năng này chưa được hỗ trợ'
    });
  };

  const addEvidence = (_id: string, _e: { filename: string; type: EvidenceType; url?: string }) => {
    setNotification({
      show: true,
      type: 'info',
      message: 'Chức năng này chưa được hỗ trợ'
    });
  };

  /* Unused - deleteEvidence function
  const deleteEvidence = (_id: string, _evidenceId: string) => {
    setNotification({
      show: true,
      type: 'info',
      message: 'Chức năng này chưa được hỗ trợ'
    });
  };
  */

  const makeDecision = async (
    id: string,
    decisionData: {
      decision: string;
      resolution: string;
      refundAmount?: number;
      actions?: string[];
      notes?: string;
    }
  ) => {
    try {
      console.log('[DEBUG] Making decision with data:', decisionData);
      await makeAdminDecision(id, decisionData);
      // Automatically update status to resolved
      await updateDisputeStatus(id, {
        status: 'resolved',
        note: 'Đã đưa ra quyết định và giải quyết tranh chấp',
        allowComplainantResponse: false,
        allowRespondentResponse: false
      });
      setNotification({
        show: true,
        type: 'success',
        message: 'Đưa ra quyết định và cập nhật trạng thái thành công'
      });
      fetchDisputes();
      // Refresh detail
      if (modal.open && modal.disputeId === id) {
        getDisputeByIdForAdmin(id)
          .then(res => setDetailDispute(res.data))
          .catch(() => {});
      }
    } catch (error: any) {
      console.error('[DEBUG] Decision error:', error.response?.data || error);
      setNotification({
        show: true,
        type: 'error',
        message: error.response?.data?.message || 'Không thể đưa ra quyết định'
      });
    }
  };

  return (
    <div className="space-y-6">
      {notification.show && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      )}

      {loading && disputes.length === 0 ? (
        <div className="flex h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200" style={{ borderTopColor: '#70C1F1' }}></div>
            <p className="mt-4 text-sm text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      ) : (
        <>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý Tranh chấp</h1>
            <p className="mt-1 text-sm text-gray-600">Theo dõi và xử lý các tranh chấp giữa Người chăm sóc và Người thuê.</p>
          </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Đang xem xét" value={stats.under_review} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.25 21.75 12 12 21.75 2.25 12 12 2.25Z"/></svg>} />
        <StatCard title="Đã giải quyết" value={stats.resolved} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12.75 11.25 15l3.75-3.75"/></svg>} />
        <StatCard title="Chờ xử lý" value={stats.pending} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M3 12h18"/></svg>} />
      </div>

      <div className="rounded-xl bg-white p-4 shadow">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="rounded border border-gray-300 bg-white px-3 py-2 text-sm">
              <option value="All">Tất cả nhóm</option>
              {(["service_quality","payment_issue","schedule_conflict","unprofessional_behavior","safety_concern","other"] as DisputeCategory[]).map(c => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="rounded border border-gray-300 bg-white px-3 py-2 text-sm">
              <option value="All">Tất cả trạng thái</option>
              {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
            <select value={severity} onChange={(e) => setSeverity(e.target.value as any)} className="rounded border border-gray-300 bg-white px-3 py-2 text-sm">
              <option value="All">Tất cả mức độ</option>
              {(["low","medium","high","critical"] as DisputeSeverity[]).map(s => <option key={s} value={s}>{SEVERITY_LABEL[s]}</option>)}
            </select>
            <select value={creator} onChange={(e) => setCreator(e.target.value as any)} className="rounded border border-gray-300 bg-white px-3 py-2 text-sm">
              <option value="All">Tất cả người tạo</option>
              <option value="careseeker">Người thuê</option>
              <option value="caregiver">Người chăm sóc</option>
            </select>
          </div>
          <div className="relative">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo ID, booking, tên, email, tóm tắt" className="w-80 rounded border border-gray-300 px-3 py-2 text-sm" />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z"/></svg>
            </span>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Booking</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nhóm</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Mức độ</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Trạng thái</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Người tạo</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Phụ trách</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <button className="inline-flex items-center gap-1" onClick={() => { setSortKey("updatedAt"); setSortAsc(k => sortKey === "updatedAt" ? !k : false); }}>
                    Cập nhật
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5H7z"/></svg>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {pageItems.map((d) => (
                <DisputeRow key={d._id} d={d} onView={openDetail} />
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500">Không có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">Hiển thị {pageItems.length} / {totalCount} kết quả</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50">Trước</button>
            <div className="text-sm">Trang {page} / {totalPages}</div>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50">Sau</button>
          </div>
        </div>
      </div>

      <DisputeDetailModal
        open={modal.open}
        dispute={detailDispute}
        loading={detailLoading}
        onClose={() => setModal({ open: false, disputeId: null })}
        onChangeStatus={changeStatus}
        onAssign={assignTo}
        onChangeSeverity={changeSeverity}
        onChangeCategory={changeCategory}
        onAddEvidence={addEvidence}
        onAddNote={addNote}
        onMakeDecision={makeDecision}
      />
        </>
      )}
    </div>
  );
};

export default AdminDisputeManagementPage;



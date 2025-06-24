import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { ChevronLeft, Flag, ClipboardCheck, Send, Phone } from "lucide-react";
import Navbar from "../../components/navbar/Navbar";

interface Goal {
  id: string;
  name: string;
  description: string | null;
  direction: string;
  subDirection: string | null;
  duration: number;
  visibility: "PUBLIC" | "PRIVATE";
  phone: string;
  telegram: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  startDate: string;
  endDate: string;
  creatorId: string;
  creator: {
    id: string;
    fullName: string;
    avatar: string | null;
  };
  participants: Array<{
    userId: string;
    role: "PARTICIPANT" | "ADMIN" | "REMOVED";
    avatar?: string;
  }>;
}

interface SubDirectionResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
  };
}

export default function GoalDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [subdirectionName, setSubdirectionName] = useState("Yo'nalish");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  // Calculate days left from endDate
  const calculateDaysLeft = (endDate: string): number => {
    const end = new Date(endDate);
    const now = new Date();
    const diffInMs = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffInMs / (1000 * 60 * 60 * 24)));
  };

  // Fetch goal and subdirection name
  useEffect(() => {
    if (!id) {
      setError("Maqsad ID topilmadi");
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch goal
        const goalResponse = await axios.get<{ success: boolean; data: Goal }>(
          `https://maqsaddosh-backend-o2af.onrender.com/api/goals/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (goalResponse.data.success) {
          const fetchedGoal = goalResponse.data.data;
          setGoal(fetchedGoal);
          setError("");

          // Check if user is creator or participant
          const userId = localStorage.getItem("userId"); // Adjust based on your auth setup
          if (userId) {
            setIsCreator(fetchedGoal.creatorId === userId);
            setIsJoined(
              fetchedGoal.participants.some(
                (p) => p.userId === userId && p.role === "PARTICIPANT"
              )
            );
          }

          // Fetch subdirection name
          if (fetchedGoal.subDirection) {
            try {
              const subDirectionResponse =
                await axios.get<SubDirectionResponse>(
                  `https://maqsaddosh-backend-o2af.onrender.com/api/directions/${fetchedGoal.subDirection}`,
                  {
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                  }
                );
              if (subDirectionResponse.data.success) {
                setSubdirectionName(subDirectionResponse.data.data.name);
              }
            } catch (err) {
              console.error("Error fetching subdirection:", err);
              setSubdirectionName("Yo'nalish");
            }
          }
        } else {
          setError("Maqsad ma'lumotlari yuklanmadi");
        }
      } catch (err: any) {
        console.error(
          "Error fetching goal:",
          err.response?.data || err.message
        );
        if (err.response?.status === 401) {
          setError("Tizimga kirish talab qilinadi");
          navigate("/login");
        } else if (err.response?.status === 403) {
          setError("Bu maqsadga kirish huquqingiz yo'q");
        } else if (err.response?.status === 404) {
          setError("Maqsad topilmadi");
        } else {
          setError("Maqsad ma'lumotlari yuklanmadi");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleGoBack = () => {
    const subdirectionId = new URLSearchParams(location.search).get(
      "subdirectionId"
    );
    if (subdirectionId) {
      navigate(`/goals?subdirectionId=${subdirectionId}`);
    } else {
      navigate(-1);
    }
  };

  const handleJoinGoal = async () => {
    if (!id || isJoined || isCreator || !goal) return;
    setIsJoining(true);
    try {
      const response = await axios.post(
        `https://maqsaddosh-backend-o2af.onrender.com/api/goals/${id}/join`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (response.data.success) {
        setIsJoined(true);
        setGoal({
          ...goal,
          participants: [
            ...goal.participants,
            {
              userId: localStorage.getItem("userId") || "",
              role: "PARTICIPANT",
            },
          ],
        });
        alert("Maqsadga muvaffaqiyatli qo'shildingiz!");
      } else {
        setError("Maqsadga qo'shilish amalga oshmadi");
      }
    } catch (err: any) {
      console.error("Error joining goal:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        setError("Tizimga kirish talab qilinadi");
        navigate("/login");
      } else if (err.response?.status === 403) {
        setError("Shaxsiy maqsadga qo'shilish mumkin emas");
      } else if (err.response?.status === 400) {
        setError("Siz allaqachon qo'shilgansiz yoki maqsad yaratuvchisiz");
      } else {
        setError("Maqsadga qo'shilishda xatolik yuz berdi");
      }
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="font-sans min-h-screen bg-[#FBFBFB]">
        <Navbar />
        <div className="max-w-[995px] mx-auto px-4 py-6">
          <p className="text-gray-600 text-center">Maqsad yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div className="font-sans min-h-screen bg-[#FBFBFB]">
        <Navbar />
        <div className="max-w-[995px] mx-auto px-4 py-6">
          <button
            onClick={handleGoBack}
            className="flex items-center text-gray-400 hover:text-gray-600 mb-4"
          >
            <ChevronLeft className="w-6 h-6" />
            <span className="text-gray-700 text-[20px]">Orqaga</span>
          </button>
          <p className="text-red-500 text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen bg-[#FBFBFB]">
      <Navbar />
      <div className="max-w-[995px] mx-auto px-4 py-6">
        {/* Back Button */}
        <div className="max-sm:bg-white py-5">
          <div className="flex items-center space-x-2 text-sm">
            <button
              onClick={handleGoBack}
              className="flex items-center text-gray-400 hover:text-gray-600"
            >
              <ChevronLeft className="w-6 h-6" />
              <span className="text-gray-700 text-[20px]">
                {subdirectionName}
              </span>
            </button>
          </div>
        </div>

        {/* Goal Details */}
        <div className="border-[1px] border-gray-200 rounded-[16px] py-4 px-5 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <img
              src={goal.creator.avatar || "/profile/default_avatar.png"}
              alt="Profile"
              className="w-8 h-8 rounded-full"
            />
            <span className="text-gray-600 text-sm">
              {goal.creator.fullName}
            </span>
          </div>

          <h1 className="text-[24px] font-semibold text-gray-950 mb-2">
            {goal.name}
          </h1>

          <div className="text-gray-700 text-[16px] mb-4">
            <p>{goal.description || "Izoh mavjud emas"}</p>
          </div>

          <div className="flex flex-col items-start justify-between">
            <div className="flex items-center text-[16px] text-gray-600 gap-2 mb-4">
              <span className="flex items-center rounded-[21px] font-medium bg-gray-100 gap-1 p-2">
                <Flag className="w-4 h-4" />
                {calculateDaysLeft(goal.endDate)} kun qoldi
              </span>
              <span className="flex items-center py-1.5 px-4 rounded-[21px] bg-gray-100 gap-1">
                <ClipboardCheck className="w-4 h-4" />
                <span className="mr-2">+{goal.participants.length}</span>
                <div className="flex -space-x-2.5">
                  {goal.participants.slice(0, 3).map((participant, index) => (
                    <img
                      key={index}
                      src={participant.avatar || "/profile/default_avatar.png"}
                      alt=""
                      className="w-6 h-6 rounded-full"
                    />
                  ))}
                </div>
              </span>
            </div>
            <button
              onClick={handleJoinGoal}
              className="cursor-pointer flex items-center gap-1 bg-blue-600 text-white text-[16px] font-medium py-2.5 px-4 rounded-[8px] hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={
                isJoining ||
                isJoined ||
                isCreator ||
                goal.visibility === "PRIVATE" ||
                goal.status !== "ACTIVE"
              }
            >
              <Send className="w-5 h-5" />
              {isJoined
                ? "Qo'shilgan"
                : isCreator
                ? "Sizning Maqsadingiz"
                : "Qo'shilish"}
            </button>
          </div>
        </div>

        {/* Contact Buttons */}
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
          <a
            href={
              goal.telegram
                ? `https://t.me/${goal.telegram.replace(/^@/, "")}`
                : "#"
            }
            className="max-w-full md:max-w-[285px] w-full bg-blue-600 text-white text-[16px] font-medium py-[18px] px-6 rounded-[16px] hover:bg-blue-700 transition-colors gap-2.5 flex items-center justify-center"
          >
            <Send className="w-6 h-6" />
            TELEGRAM ORQALI
          </a>
          <a
            href={goal.phone ? `tel:${goal.phone}` : "#"}
            className="max-w-full md:max-w-[285px] w-full border border-blue-600 text-gray-800 font-medium py-[18px] px-6 rounded-[16px] gap-2.5 hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            <Phone className="w-6 h-6" />
            QO'NG'IROQ QILISH
          </a>
        </div>
      </div>
    </div>
  );
}

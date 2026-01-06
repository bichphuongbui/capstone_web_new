import React, { useEffect, useState } from "react";
import { getUsersByRole, UsersByRoleData, getBookingsStatistics, BookingStatistic, getUserStatistics, UserStatisticsData, getCaregiverStatistics, CaregiverStatisticsData } from "../../services/admin.service";

const AdminDashboardPage: React.FC = () => {
  const [usersByRole, setUsersByRole] = useState<UsersByRoleData[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [bookingsData, setBookingsData] = useState<BookingStatistic[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState<boolean>(true);
  const [userStats, setUserStats] = useState<UserStatisticsData | null>(null);
  const [userStatsLoading, setUserStatsLoading] = useState<boolean>(true);
  const [caregiverStats, setCaregiverStats] = useState<CaregiverStatisticsData | null>(null);
  const [caregiverStatsLoading, setCaregiverStatsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setBookingsLoading(true);
        setUserStatsLoading(true);
        setCaregiverStatsLoading(true);
        
        const [usersResponse, bookingsResponse, userStatsResponse, caregiverStatsResponse] = await Promise.all([
          getUsersByRole(),
          getBookingsStatistics(),
          getUserStatistics(),
          getCaregiverStatistics()
        ]);
        
        if (usersResponse.success) {
          setUsersByRole(usersResponse.data.users);
          setTotalUsers(usersResponse.data.total);
        }
        
        if (bookingsResponse.success) {
          setBookingsData(bookingsResponse.data.bookings);
        }
        
        if (userStatsResponse.status === 'Success') {
          setUserStats(userStatsResponse.data);
        }
        
        if (caregiverStatsResponse.status === 'Success') {
          setCaregiverStats(caregiverStatsResponse.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
        setBookingsLoading(false);
        setUserStatsLoading(false);
        setCaregiverStatsLoading(false);
      }
    };

    fetchData();
  }, []);

  const roleColors: Record<string, string> = {
    careseeker: '#3b82f6',
    caregiver: '#f59e0b',
    admin: '#a855f7',
  };

  const roleBgColors: Record<string, string> = {
    careseeker: 'bg-blue-500',
    caregiver: 'bg-amber-500',
    admin: 'bg-purple-500',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-r from-indigo-50 via-white to-emerald-50 p-6 sm:p-8">
          <div className="relative z-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-indigo-600">Bảng điều khiển</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Quản trị hệ thống</h1>
              <p className="mt-1 text-sm text-gray-600">Tổng quan nhanh về người dùng, đặt lịch và phản hồi.</p>
            </div>
            
          </div>
          <div className="pointer-events-none absolute -right-10 top-0 -z-10 h-40 w-40 rounded-full bg-indigo-100 opacity-60 blur-2xl" />
          <div className="pointer-events-none absolute -left-10 -bottom-10 -z-10 h-40 w-40 rounded-full bg-emerald-100 opacity-60 blur-2xl" />
        </div>

        <div className="mt-8">
          {/* User Statistics - Stacked Bar Chart */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm max-w-2xl mx-auto">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">Thống kê người dùng</h2>
            
            {userStatsLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
              </div>
            ) : userStats ? (
              <div className="space-y-6">
                {/* Legend */}
                <div className="flex items-center justify-center gap-6 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-[#22c55e] shadow-sm"></div>
                    <span className="text-gray-700">Đã xác thực</span>
                    <span className="font-bold text-[#22c55e]">{userStats.totalRegisteredUsers - userStats.totalUnverifiedUsers}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-[#fbbf24] shadow-sm"></div>
                    <span className="text-gray-700">Chưa xác thực</span>
                    <span className="font-bold text-[#f59e0b]">{userStats.totalUnverifiedUsers}</span>
                  </div>
                </div>

                {/* Stacked Bar Chart */}
                <div className="relative bg-white rounded-lg p-4" style={{ height: '420px' }}>
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-6 bottom-12 w-10 flex flex-col-reverse text-xs font-medium text-gray-600">
                    {(() => {
                      const max = userStats.totalRegisteredUsers;
                      const gridCount = 8;
                      const step = Math.ceil(max / gridCount);
                      const actualMax = step * gridCount; // Round up để đủ chỗ
                      const values = [];
                      for (let i = 0; i <= gridCount; i++) {
                        values.push(i * step);
                      }
                      return values.map((val, idx) => (
                        <div key={idx} className="text-right pr-2 leading-none" style={{ height: `${100 / gridCount}%` }}>
                          {val}
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Chart area */}
                  <div className="absolute left-10 right-0 top-6 bottom-12 border-l border-b border-gray-300">
                    {/* Grid lines */}
                    <div className="absolute inset-0">
                      {(() => {
                        const gridCount = 8;
                        return Array.from({ length: gridCount + 1 }, (_, i) => (
                          <div 
                            key={i}
                            className="absolute left-0 right-0 border-t border-gray-200"
                            style={{ bottom: `${(i / gridCount) * 100}%` }}
                          ></div>
                        ));
                      })()}
                    </div>

                    {/* Bars container */}
                    <div className="absolute inset-0 flex items-end justify-around px-8 pb-0">
                      {(() => {
                        const gridCount = 8;
                        const step = Math.ceil(userStats.totalRegisteredUsers / gridCount);
                        const maxValue = step * gridCount; // Giá trị max để tính % height
                        
                        const bars = [
                          {
                            label: 'Tổng',
                            verified: userStats.totalRegisteredUsers - userStats.totalUnverifiedUsers,
                            unverified: userStats.totalUnverifiedUsers,
                            total: userStats.totalRegisteredUsers
                          },
                          {
                            label: 'Người chăm sóc',
                            verified: userStats.totalCaregivers - userStats.unverifiedCaregivers,
                            unverified: userStats.unverifiedCaregivers,
                            total: userStats.totalCaregivers
                          },
                          {
                            label: 'Người cần chăm sóc',
                            verified: userStats.totalCareSeekers - userStats.unverifiedCareSeekers,
                            unverified: userStats.unverifiedCareSeekers,
                            total: userStats.totalCareSeekers
                          }
                        ];

                        return bars.map((bar, idx) => {
                          const verifiedHeight = (bar.verified / maxValue) * 100;
                          const unverifiedHeight = (bar.unverified / maxValue) * 100;
                          const totalHeight = verifiedHeight + unverifiedHeight;
                          
                          return (
                            <div key={idx} className="flex flex-col items-center relative" style={{ width: '22%', height: '100%' }}>
                              {/* Total label on top - positioned absolutely above the bar */}
                              <div 
                                className="absolute text-lg font-bold text-[#f97316] z-10"
                                style={{ 
                                  bottom: `${totalHeight}%`,
                                  transform: 'translateY(-8px)'
                                }}
                              >
                                {bar.total}
                              </div>
                              
                              {/* Stacked bar */}
                              <div className="relative w-full" style={{ height: '100%' }}>
                                {/* Verified (green) - bottom part */}
                                <div 
                                  className="absolute bottom-0 left-0 right-0 bg-[#22c55e] flex items-center justify-center transition-all shadow-sm"
                                  style={{ 
                                    height: `${verifiedHeight}%`,
                                    borderRadius: unverifiedHeight === 0 ? '4px 4px 0 0' : '0'
                                  }}
                                >
                                  {bar.verified > 0 && verifiedHeight > 8 && (
                                    <span className="text-sm font-bold text-white">
                                      {bar.verified}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Unverified (amber) - top part */}
                                {bar.unverified > 0 && (
                                  <div 
                                    className="absolute left-0 right-0 bg-[#fbbf24] flex items-center justify-center transition-all rounded-t shadow-sm"
                                    style={{ 
                                      bottom: `${verifiedHeight}%`,
                                      height: `${unverifiedHeight}%`
                                    }}
                                  >
                                    {unverifiedHeight > 8 && (
                                      <span className="text-sm font-bold text-white">
                                        {bar.unverified}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* X-axis labels */}
                  <div className="absolute left-10 right-0 bottom-0 h-12 flex items-center justify-around px-8">
                    <div className="text-sm font-semibold text-gray-700 text-center" style={{ width: '22%' }}>Tổng</div>
                    <div className="text-sm font-semibold text-gray-700 text-center" style={{ width: '22%' }}>Người chăm sóc</div>
                    <div className="text-sm font-semibold text-gray-700 text-center" style={{ width: '22%' }}>Người cần chăm sóc</div>
                  </div>
                </div>

                {/* Summary */}
                <div className="rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 p-5 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-purple-900">Tỷ lệ xác thực</span>
                    <span className="text-3xl font-bold text-purple-900">
                      {((userStats.totalRegisteredUsers - userStats.totalUnverifiedUsers) / userStats.totalRegisteredUsers * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-gray-400">
                <p>Không có dữ liệu</p>
              </div>
            )}
          </div>

          {/* Caregiver Statistics - Pie Chart */}
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm max-w-2xl mx-auto">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">Thống kê người chăm sóc</h2>
            
            {caregiverStatsLoading ? (
              <div className="flex h-96 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
              </div>
            ) : caregiverStats ? (
              <div className="space-y-6">
                {/* Legend */}
                <div className="flex items-center justify-center gap-6 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-[#22c55e] shadow-sm"></div>
                    <span className="text-gray-700">Đã xác thực</span>
                    <span className="font-bold text-[#22c55e]">
                      {caregiverStats.totalCaregivers - caregiverStats.pendingVerificationCaregivers}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-[#f59e0b] shadow-sm"></div>
                    <span className="text-gray-700">Chờ xác thực</span>
                    <span className="font-bold text-[#f59e0b]">
                      {caregiverStats.pendingVerificationCaregivers}
                    </span>
                  </div>
                </div>

                {/* Pie Chart */}
                <div className="relative mx-auto" style={{ width: '320px', height: '320px' }}>
                  <svg viewBox="0 0 200 200" className="h-full w-full">
                    {(() => {
                      const verified = caregiverStats.totalCaregivers - caregiverStats.pendingVerificationCaregivers;
                      const pending = caregiverStats.pendingVerificationCaregivers;
                      const total = caregiverStats.totalCaregivers;
                      
                      if (total === 0) {
                        return (
                          <text x="100" y="100" textAnchor="middle" fill="#9ca3af" fontSize="14">
                            Chưa có dữ liệu
                          </text>
                        );
                      }
                      
                      const slices = [
                        { label: 'Đã xác thực', value: verified, color: '#22c55e' },
                        { label: 'Chờ xác thực', value: pending, color: '#f59e0b' }
                      ].filter(s => s.value > 0);
                      
                      // If only one slice with 100%, draw a full circle
                      if (slices.length === 1) {
                        return (
                          <>
                            <circle
                              cx="100"
                              cy="100"
                              r="80"
                              fill={slices[0].color}
                              className="transition-opacity hover:opacity-90 cursor-pointer drop-shadow-lg"
                            />
                            <text
                              x="100"
                              y="95"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="white"
                              fontSize="32"
                              fontWeight="700"
                            >
                              100%
                            </text>
                            <text
                              x="100"
                              y="115"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="white"
                              fontSize="14"
                              fontWeight="600"
                            >
                              {slices[0].label}
                            </text>
                          </>
                        );
                      }
                      
                      let currentAngle = -90; // Start from top
                      
                      return (
                        <>
                          {slices.map((slice, index) => {
                            const percentage = (slice.value / total) * 100;
                            const angle = (percentage / 100) * 360;
                            
                            const startAngle = currentAngle;
                            const endAngle = currentAngle + angle;
                            
                            // Convert to radians
                            const startRad = (startAngle * Math.PI) / 180;
                            const endRad = (endAngle * Math.PI) / 180;
                            
                            const radius = 80;
                            const centerX = 100;
                            const centerY = 100;
                            
                            // Calculate arc points
                            const x1 = centerX + radius * Math.cos(startRad);
                            const y1 = centerY + radius * Math.sin(startRad);
                            const x2 = centerX + radius * Math.cos(endRad);
                            const y2 = centerY + radius * Math.sin(endRad);
                            
                            const largeArc = angle > 180 ? 1 : 0;
                            
                            const pathData = [
                              `M ${centerX} ${centerY}`,
                              `L ${x1} ${y1}`,
                              `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                              'Z'
                            ].join(' ');
                            
                            // Calculate label position
                            const labelAngle = startAngle + angle / 2;
                            const labelRad = (labelAngle * Math.PI) / 180;
                            const labelRadius = radius * 0.6;
                            const labelX = centerX + labelRadius * Math.cos(labelRad);
                            const labelY = centerY + labelRadius * Math.sin(labelRad);
                            
                            currentAngle = endAngle;
                            
                            return (
                              <g key={index}>
                                <path
                                  d={pathData}
                                  fill={slice.color}
                                  className="transition-all hover:opacity-90 cursor-pointer drop-shadow-lg"
                                  style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
                                />
                                {/* Percentage and count label */}
                                <text
                                  x={labelX}
                                  y={labelY - 8}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fill="white"
                                  fontSize="20"
                                  fontWeight="700"
                                >
                                  {percentage.toFixed(0)}%
                                </text>
                                <text
                                  x={labelX}
                                  y={labelY + 10}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fill="white"
                                  fontSize="14"
                                  fontWeight="600"
                                >
                                  ({slice.value})
                                </text>
                              </g>
                            );
                          })}
                        </>
                      );
                    })()})
                  </svg>
                </div>

                {/* Summary */}
                <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100 p-5 border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-emerald-900">Tổng số người chăm sóc</span>
                    <span className="text-3xl font-bold text-emerald-900">
                      {caregiverStats.totalCaregivers}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-emerald-700">Tỷ lệ đã xác thực</span>
                    <span className="text-lg font-bold text-emerald-700">
                      {caregiverStats.totalCaregivers > 0 
                        ? (((caregiverStats.totalCaregivers - caregiverStats.pendingVerificationCaregivers) / caregiverStats.totalCaregivers) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-96 items-center justify-center text-gray-400">
                <p>Không có dữ liệu</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;



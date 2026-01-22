import React, { useEffect, useState } from "react";
import { 
  getUsersByRole, 
  UsersByRoleData, 
  getBookingsStatistics, 
  BookingStatistic, 
  getUserStatistics, 
  UserStatisticsData, 
  getCaregiverStatistics, 
  CaregiverStatisticsData,
  getFeedbackDashboardStatistics,
  FeedbackDashboardData
} from "../../services/admin.service";

const AdminDashboardPage: React.FC = () => {
  const [, setUsersByRole] = useState<UsersByRoleData[]>([]);
  const [, setTotalUsers] = useState<number>(0);
  const [, setLoading] = useState<boolean>(true);
  const [, setBookingsData] = useState<BookingStatistic[]>([]);
  const [, setBookingsLoading] = useState<boolean>(true);
  const [userStats, setUserStats] = useState<UserStatisticsData | null>(null);
  const [userStatsLoading, setUserStatsLoading] = useState<boolean>(true);
  const [caregiverStats, setCaregiverStats] = useState<CaregiverStatisticsData | null>(null);
  const [caregiverStatsLoading, setCaregiverStatsLoading] = useState<boolean>(true);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackDashboardData | null>(null);
  const [feedbackStatsLoading, setFeedbackStatsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setBookingsLoading(true);
        setUserStatsLoading(true);
        setCaregiverStatsLoading(true);
        setFeedbackStatsLoading(true);
        
        const [usersResponse, bookingsResponse, userStatsResponse, caregiverStatsResponse, feedbackStatsResponse] = await Promise.all([
          getUsersByRole(),
          getBookingsStatistics(),
          getUserStatistics(),
          getCaregiverStatistics(),
          getFeedbackDashboardStatistics()
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

        if (feedbackStatsResponse.status === 'Success') {
          setFeedbackStats(feedbackStatsResponse.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
        setBookingsLoading(false);
        setUserStatsLoading(false);
        setCaregiverStatsLoading(false);
        setFeedbackStatsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Admin Dashboard</p>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Bảng điều khiển</h1>
              <p className="text-sm text-gray-600 mt-1">Tổng quan và phân tích hoạt động hệ thống</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {userStats && (
            <>
              <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Tổng người dùng</p>
                  <p className="text-3xl font-bold text-gray-900">{userStats.totalRegisteredUsers}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1 text-green-600 font-medium">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {userStats.totalRegisteredUsers - userStats.totalUnverifiedUsers} xác thực
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Caregivers</p>
                  <p className="text-3xl font-bold text-gray-900">{userStats.totalCaregivers}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500">{((userStats.totalCaregivers / userStats.totalRegisteredUsers) * 100).toFixed(0)}% tổng số</span>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0 .656.126 1.283.356 1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Care Seekers</p>
                  <p className="text-3xl font-bold text-gray-900">{userStats.totalCareSeekers}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500">{((userStats.totalCareSeekers / userStats.totalRegisteredUsers) * 100).toFixed(0)}% tổng số</span>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Tỷ lệ xác thực</p>
                  <p className="text-3xl font-bold text-gray-900">{((userStats.totalRegisteredUsers - userStats.totalUnverifiedUsers) / userStats.totalRegisteredUsers * 100).toFixed(1)}%</p>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full" style={{ width: `${((userStats.totalRegisteredUsers - userStats.totalUnverifiedUsers) / userStats.totalRegisteredUsers * 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* User Statistics Chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Thống kê người dùng</h2>
                  <p className="text-xs text-gray-500">Phân bố theo trạng thái xác thực</p>
                </div>
              </div>
            </div>
            
            {userStatsLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
              </div>
            ) : userStats ? (
              <div className="space-y-6">
                {/* Legend */}
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                    <span className="text-gray-600">Đã xác thực</span>
                    <span className="font-semibold text-gray-900">{userStats.totalRegisteredUsers - userStats.totalUnverifiedUsers}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-amber-400"></div>
                    <span className="text-gray-600">Chưa xác thực</span>
                    <span className="font-semibold text-gray-900">{userStats.totalUnverifiedUsers}</span>
                  </div>
                </div>

                {/* Stacked Bar Chart */}
                <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border border-gray-100" style={{ height: '380px' }}>
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-6 bottom-12 w-12 flex flex-col-reverse text-xs font-medium text-gray-500">
                    {(() => {
                      const max = userStats.totalRegisteredUsers;
                      const gridCount = 6;
                      const step = Math.ceil(max / gridCount);
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
                  <div className="absolute left-12 right-0 top-6 bottom-12 border-l border-b border-gray-200">
                    {/* Grid lines */}
                    <div className="absolute inset-0">
                      {(() => {
                        const gridCount = 6;
                        return Array.from({ length: gridCount + 1 }, (_, i) => (
                          <div 
                            key={i}
                            className="absolute left-0 right-0 border-t border-gray-100"
                            style={{ bottom: `${(i / gridCount) * 100}%` }}
                          ></div>
                        ));
                      })()}
                    </div>

                    {/* Bars container */}
                    <div className="absolute inset-0 flex items-end justify-around px-8 pb-0">
                      {(() => {
                        const gridCount = 6;
                        const step = Math.ceil(userStats.totalRegisteredUsers / gridCount);
                        const maxValue = step * gridCount;
                        
                        const bars = [
                          { label: 'Tổng', verified: userStats.totalRegisteredUsers - userStats.totalUnverifiedUsers, unverified: userStats.totalUnverifiedUsers, total: userStats.totalRegisteredUsers },
                          { label: 'Caregivers', verified: userStats.totalCaregivers - userStats.unverifiedCaregivers, unverified: userStats.unverifiedCaregivers, total: userStats.totalCaregivers },
                          { label: 'Care Seekers', verified: userStats.totalCareSeekers - userStats.unverifiedCareSeekers, unverified: userStats.unverifiedCareSeekers, total: userStats.totalCareSeekers }
                        ];

                        return bars.map((bar, idx) => {
                          const verifiedHeight = (bar.verified / maxValue) * 100;
                          const unverifiedHeight = (bar.unverified / maxValue) * 100;
                          const totalHeight = verifiedHeight + unverifiedHeight;
                          
                          return (
                            <div key={idx} className="flex flex-col items-center relative group" style={{ width: '24%', height: '100%' }}>
                              {/* Total label on top */}
                              <div 
                                className="absolute text-base font-bold text-gray-900 z-10 transition-all group-hover:scale-110"
                                style={{ bottom: `${totalHeight}%`, transform: 'translateY(-8px)' }}
                              >
                                {bar.total}
                              </div>
                              
                              {/* Stacked bar */}
                              <div className="relative w-full" style={{ height: '100%' }}>
                                {/* Verified (emerald) - bottom part */}
                                <div 
                                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-500 to-emerald-400 flex items-center justify-center transition-all shadow-sm group-hover:shadow-md"
                                  style={{ height: `${verifiedHeight}%`, borderRadius: unverifiedHeight === 0 ? '6px 6px 0 0' : '0' }}
                                >
                                  {bar.verified > 0 && verifiedHeight > 10 && (
                                    <span className="text-xs font-semibold text-white">{bar.verified}</span>
                                  )}
                                </div>
                                
                                {/* Unverified (amber) - top part */}
                                {bar.unverified > 0 && (
                                  <div 
                                    className="absolute left-0 right-0 bg-gradient-to-t from-amber-400 to-amber-300 flex items-center justify-center transition-all rounded-t-md shadow-sm group-hover:shadow-md"
                                    style={{ bottom: `${verifiedHeight}%`, height: `${unverifiedHeight}%` }}
                                  >
                                    {unverifiedHeight > 10 && (
                                      <span className="text-xs font-semibold text-white">{bar.unverified}</span>
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
                  <div className="absolute left-12 right-0 bottom-0 h-12 flex items-center justify-around px-8">
                    <div className="text-xs font-semibold text-gray-700 text-center" style={{ width: '24%' }}>Tổng</div>
                    <div className="text-xs font-semibold text-gray-700 text-center" style={{ width: '24%' }}>Caregivers</div>
                    <div className="text-xs font-semibold text-gray-700 text-center" style={{ width: '24%' }}>Care Seekers</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-gray-400">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-sm">Không có dữ liệu</p>
                </div>
              </div>
            )}
          </div>

          {/* Caregiver Statistics - Pie Chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                  <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Caregivers</h2>
                  <p className="text-xs text-gray-500">Trạng thái xác thực</p>
                </div>
              </div>
            </div>
            
            {caregiverStatsLoading ? (
              <div className="flex h-96 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600"></div>
              </div>
            ) : caregiverStats ? (
              <div className="space-y-6">
                {/* Legend */}
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                    <span className="text-gray-600">Đã xác thực</span>
                    <span className="font-semibold text-gray-900">{caregiverStats.totalCaregivers - caregiverStats.pendingVerificationCaregivers}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-amber-400"></div>
                    <span className="text-gray-600">Chờ xác thực</span>
                    <span className="font-semibold text-gray-900">{caregiverStats.pendingVerificationCaregivers}</span>
                  </div>
                </div>

                {/* Pie Chart */}
                <div className="relative mx-auto" style={{ width: '280px', height: '280px' }}>
                  <svg viewBox="0 0 200 200" className="h-full w-full drop-shadow-md">
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
                        { label: 'Đã xác thực', value: verified, color: '#10b981' },
                        { label: 'Chờ xác thực', value: pending, color: '#fbbf24' }
                      ].filter(s => s.value > 0);
                      
                      if (slices.length === 1) {
                        return (
                          <>
                            <circle cx="100" cy="100" r="75" fill={slices[0].color} className="transition-opacity hover:opacity-90 cursor-pointer" />
                            <text x="100" y="95" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="28" fontWeight="700">100%</text>
                            <text x="100" y="115" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="12" fontWeight="600">{slices[0].label}</text>
                          </>
                        );
                      }
                      
                      let currentAngle = -90;
                      
                      return (
                        <>
                          {slices.map((slice, index) => {
                            const percentage = (slice.value / total) * 100;
                            const angle = (percentage / 100) * 360;
                            
                            const startAngle = currentAngle;
                            const endAngle = currentAngle + angle;
                            const startRad = (startAngle * Math.PI) / 180;
                            const endRad = (endAngle * Math.PI) / 180;
                            const radius = 75;
                            const centerX = 100;
                            const centerY = 100;
                            
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
                            
                            const labelAngle = startAngle + angle / 2;
                            const labelRad = (labelAngle * Math.PI) / 180;
                            const labelRadius = radius * 0.6;
                            const labelX = centerX + labelRadius * Math.cos(labelRad);
                            const labelY = centerY + labelRadius * Math.sin(labelRad);
                            
                            currentAngle = endAngle;
                            
                            return (
                              <g key={index}>
                                <path d={pathData} fill={slice.color} className="transition-all hover:opacity-90 cursor-pointer" />
                                <text x={labelX} y={labelY - 6} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="18" fontWeight="700">{percentage.toFixed(0)}%</text>
                                <text x={labelX} y={labelY + 10} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="12" fontWeight="600">({slice.value})</text>
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                </div>

                {/* Summary */}
                <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-5 border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-emerald-900">Tổng số caregivers</span>
                    <span className="text-2xl font-bold text-emerald-900">{caregiverStats.totalCaregivers}</span>
                  </div>
                  <div className="mt-3 h-2 w-full bg-emerald-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all" style={{ width: `${caregiverStats.totalCaregivers > 0 ? (((caregiverStats.totalCaregivers - caregiverStats.pendingVerificationCaregivers) / caregiverStats.totalCaregivers) * 100) : 0}%` }}></div>
                  </div>
                  <p className="text-xs text-emerald-700 mt-2">
                    {caregiverStats.totalCaregivers > 0 ? (((caregiverStats.totalCaregivers - caregiverStats.pendingVerificationCaregivers) / caregiverStats.totalCaregivers) * 100).toFixed(1) : 0}% đã xác thực
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-96 items-center justify-center text-gray-400">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                  <p className="text-sm">Không có dữ liệu</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Dashboard Statistics */}
        <div className="mb-8">
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Thống kê phản hồi</h2>
                  <p className="text-sm text-gray-600">Đánh giá chất lượng dịch vụ</p>
                </div>
              </div>
            </div>
            
            {feedbackStatsLoading ? (
              <div className="flex h-96 items-center justify-center">
                <div className="relative">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full bg-purple-100"></div>
                  </div>
                </div>
              </div>
            ) : feedbackStats ? (
                <div className="space-y-8">
                  {/* Overview Section */}
                  <div>
                    <div className="mb-5 flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-purple-500"></div>
                      <h3 className="text-lg font-bold text-gray-800">Tổng quan theo loại</h3>
                    </div>
                    <div className="grid gap-5 md:grid-cols-3">
                      {feedbackStats.overview.map((item, idx) => {
                        const colors = [
                          { from: 'from-purple-500', to: 'to-pink-500', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
                          { from: 'from-blue-500', to: 'to-cyan-500', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
                          { from: 'from-orange-500', to: 'to-red-500', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
                        ];
                        const color = colors[idx] || colors[0];
                        
                        return (
                          <div key={item.targetType} className={`group relative overflow-hidden rounded-2xl border ${color.border} ${color.bg} p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl`}>
                            <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${color.from} ${color.to} opacity-10 transition-all duration-300 group-hover:scale-150`}></div>
                            <div className="relative">
                              <div className="mb-4 flex items-center justify-between">
                                <span className={`inline-flex items-center rounded-full ${color.bg} px-3 py-1 text-xs font-bold uppercase tracking-wide ${color.text}`}>
                                  {item.targetType}
                                </span>
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color.from} ${color.to} shadow-md`}>
                                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                </div>
                              </div>
                              <div className="mb-2">
                                <span className="text-4xl font-bold text-gray-900">{item.averageRating.toFixed(1)}</span>
                                <span className="ml-2 text-sm text-gray-500">/5.0</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white">
                                  <div className={`h-full rounded-full bg-gradient-to-r ${color.from} ${color.to} transition-all duration-500`} style={{ width: `${(item.averageRating / 5) * 100}%` }}></div>
                                </div>
                                <span className="text-sm font-semibold text-gray-600">{item.totalFeedback}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Service Details Section */}
                  <div>
                    <div className="mb-5 flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-purple-500"></div>
                      <h3 className="text-lg font-bold text-gray-800">Chi tiết dịch vụ</h3>
                    </div>
                    <div className="grid gap-6 lg:grid-cols-2">
                      {/* Caregiver Details */}
                      <div className="group relative overflow-hidden rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 shadow-lg transition-all duration-300 hover:shadow-2xl">
                        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-200 opacity-20 blur-2xl transition-all duration-500 group-hover:scale-150"></div>
                        
                        <div className="relative">
                          <div className="mb-5 flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
                              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-emerald-900">Đánh giá Caregiver</h4>
                              <p className="text-xs text-emerald-600">Từ Care Seekers</p>
                            </div>
                          </div>

                          <div className="mb-5 grid grid-cols-2 gap-4">
                            <div className="rounded-xl bg-white p-4 shadow-sm">
                              <p className="mb-1 text-xs font-medium text-emerald-600">Tổng phản hồi</p>
                              <p className="text-2xl font-bold text-emerald-900">{feedbackStats.serviceDetails.caregiverDetails.totalFeedback}</p>
                            </div>
                            <div className="rounded-xl bg-white p-4 shadow-sm">
                              <p className="mb-1 text-xs font-medium text-emerald-600">Rating TB</p>
                              <div className="flex items-center gap-2">
                                <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="text-2xl font-bold text-emerald-900">{feedbackStats.serviceDetails.caregiverDetails.averageRating.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl border border-emerald-200 bg-white/60 p-4">
                            <p className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-800">
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                              Tiêu chí chi tiết
                            </p>
                            <div className="space-y-3">
                              {feedbackStats.serviceDetails.caregiverDetails.detailedCriteria.map((criteria, idx) => {
                                const criteriaNames: Record<string, string> = {
                                  professionalism: 'Chuyên nghiệp',
                                  attitude: 'Thái độ',
                                  punctuality: 'Đúng giờ',
                                  quality: 'Chất lượng'
                                };
                                const iconPaths = [
                                  'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', // professionalism - check circle
                                  'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', // attitude - smile
                                  'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', // punctuality - clock
                                  'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' // quality - badge
                                ];
                                
                                return (
                                  <div key={criteria.criteriaName} className="group/item flex items-center gap-3 rounded-lg bg-gradient-to-r from-emerald-50/50 to-transparent p-2 transition-all hover:from-emerald-100">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 flex-shrink-0">
                                      <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPaths[idx]} />
                                      </svg>
                                    </div>
                                    <div className="flex-1">
                                      <div className="mb-1 flex items-center justify-between">
                                        <span className="text-sm font-semibold text-gray-700">{criteriaNames[criteria.criteriaName] || criteria.criteriaName}</span>
                                        <div className="flex items-center gap-1">
                                          <svg className="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                          </svg>
                                          <span className="text-sm font-bold text-gray-900">{criteria.averageRating.toFixed(1)}</span>
                                          <span className="text-xs text-gray-500">({criteria.totalFeedback})</span>
                                        </div>
                                      </div>
                                      <div className="h-1.5 overflow-hidden rounded-full bg-emerald-100">
                                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500" style={{ width: `${(criteria.averageRating / 5) * 100}%` }}></div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Care Seeker Details */}
                      <div className="group relative overflow-hidden rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 shadow-lg transition-all duration-300 hover:shadow-2xl">
                        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-200 opacity-20 blur-2xl transition-all duration-500 group-hover:scale-150"></div>
                        
                        <div className="relative">
                          <div className="mb-5 flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg">
                              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-blue-900">Đánh giá Care Seeker</h4>
                              <p className="text-xs text-blue-600">Từ Caregivers</p>
                            </div>
                          </div>

                          <div className="mb-5 grid grid-cols-2 gap-4">
                            <div className="rounded-xl bg-white p-4 shadow-sm">
                              <p className="mb-1 text-xs font-medium text-blue-600">Tổng phản hồi</p>
                              <p className="text-2xl font-bold text-blue-900">{feedbackStats.serviceDetails.careSeekerDetails.totalFeedback}</p>
                            </div>
                            <div className="rounded-xl bg-white p-4 shadow-sm">
                              <p className="mb-1 text-xs font-medium text-blue-600">Rating TB</p>
                              <div className="flex items-center gap-2">
                                <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="text-2xl font-bold text-blue-900">{feedbackStats.serviceDetails.careSeekerDetails.averageRating.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl border border-blue-200 bg-white/60 p-6">
                            <div className="text-center">
                              <div className="relative mx-auto mb-4 h-32 w-32">
                                <svg className="h-32 w-32 -rotate-90 transform" viewBox="0 0 120 120">
                                  <circle cx="60" cy="60" r="50" fill="none" stroke="#dbeafe" strokeWidth="12" />
                                  <circle 
                                    cx="60" 
                                    cy="60" 
                                    r="50" 
                                    fill="none" 
                                    stroke="url(#blueGradient)" 
                                    strokeWidth="12"
                                    strokeDasharray={`${(feedbackStats.serviceDetails.careSeekerDetails.averageRating / 5) * 314} 314`}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000"
                                  />
                                  <defs>
                                    <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                      <stop offset="0%" stopColor="#3b82f6" />
                                      <stop offset="100%" stopColor="#6366f1" />
                                    </linearGradient>
                                  </defs>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="text-center">
                                    <div className="text-3xl font-bold text-blue-900">{feedbackStats.serviceDetails.careSeekerDetails.averageRating.toFixed(1)}</div>
                                    <div className="text-xs text-blue-600">/ 5.0</div>
                                  </div>
                                </div>
                              </div>
                              <p className="text-sm font-medium text-blue-700">Mức độ hài lòng trung bình</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Caregivers Section */}
                  <div>
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-1 rounded-full bg-purple-500"></div>
                        <h3 className="text-lg font-bold text-gray-800">Top 5 Caregivers xuất sắc</h3>
                      </div>
                      <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Bảng xếp hạng
                      </div>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="bg-gradient-to-r from-purple-500 to-pink-500">
                              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white">Hạng</th>
                              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white">Caregiver</th>
                              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white">Email</th>
                              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white">Đánh giá</th>
                              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white">Số lượng</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {feedbackStats.topCaregivers.map((caregiver, index) => {
                              const rankColors = [
                                'from-yellow-400 to-orange-500',
                                'from-gray-300 to-gray-400',
                                'from-orange-400 to-red-500',
                                'from-blue-400 to-blue-500',
                                'from-purple-400 to-purple-500'
                              ];
                              
                              return (
                                <tr key={caregiver.caregiverId} className="group transition-all duration-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50">
                                  <td className="whitespace-nowrap px-6 py-4">
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${rankColors[index]} shadow-lg transition-all duration-300 group-hover:scale-110`}>
                                      <span className="text-xl font-bold text-white">{index + 1}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-400 text-sm font-bold text-white shadow">
                                        {caregiver.caregiverName.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <div className="font-semibold text-gray-900">{caregiver.caregiverName}</div>
                                        <div className="text-xs text-gray-500">ID: {caregiver.caregiverId.slice(0, 8)}...</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                      </svg>
                                      {caregiver.caregiverEmail}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                      <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                          <svg key={i} className={`h-5 w-5 ${i < Math.round(caregiver.overallRating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                          </svg>
                                        ))}
                                      </div>
                                      <span className="font-bold text-gray-900">{caregiver.overallRating.toFixed(1)}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1">
                                      <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                      </svg>
                                      <span className="font-semibold text-purple-900">{caregiver.totalFeedback}</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-96 flex-col items-center justify-center text-gray-400">
                  <svg className="mb-4 h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-lg font-medium">Không có dữ liệu</p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;



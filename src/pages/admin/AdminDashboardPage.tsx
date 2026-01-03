import React, { useEffect, useState } from "react";
import { getUsersByRole, UsersByRoleData, getBookingsStatistics, BookingStatistic } from "../../services/admin.service";

const AdminDashboardPage: React.FC = () => {
  const [usersByRole, setUsersByRole] = useState<UsersByRoleData[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [bookingsData, setBookingsData] = useState<BookingStatistic[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setBookingsLoading(true);
        
        const [usersResponse, bookingsResponse] = await Promise.all([
          getUsersByRole(),
          getBookingsStatistics()
        ]);
        
        if (usersResponse.success) {
          setUsersByRole(usersResponse.data.users);
          setTotalUsers(usersResponse.data.total);
        }
        
        if (bookingsResponse.success) {
          setBookingsData(bookingsResponse.data.bookings);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
        setBookingsLoading(false);
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

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Bookings Statistics Chart */}
          <div className="lg:col-span-7 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">Thống kê đặt lịch (30 ngày)</h2>
            
            {bookingsLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
              </div>
            ) : bookingsData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-gray-400">
                <p>Chưa có dữ liệu</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Pie Chart */}
                <div className="relative mx-auto h-80 w-80">
                  <svg viewBox="0 0 200 200" className="h-full w-full">
                    {(() => {
                      const totals = bookingsData.reduce((acc, b) => ({
                        pending: acc.pending + b.pending,
                        confirmed: acc.confirmed + b.confirmed,
                        inProgress: acc.inProgress + b['in-progress'],
                        completed: acc.completed + b.completed,
                        cancelled: acc.cancelled + b.cancelled,
                      }), { pending: 0, confirmed: 0, inProgress: 0, completed: 0, cancelled: 0 });
                      
                      const total = totals.pending + totals.confirmed + totals.inProgress + totals.completed + totals.cancelled;
                      
                      if (total === 0) {
                        return (
                          <text x="100" y="100" textAnchor="middle" fill="#9ca3af" fontSize="14">
                            Chưa có dữ liệu
                          </text>
                        );
                      }
                      
                      const slices = [
                        { label: 'Chờ xác nhận', value: totals.pending, color: '#eab308' },
                        { label: 'Đã xác nhận', value: totals.confirmed, color: '#3b82f6' },
                        { label: 'Đang thực hiện', value: totals.inProgress, color: '#a855f7' },
                        { label: 'Hoàn thành', value: totals.completed, color: '#22c55e' },
                        { label: 'Đã hủy', value: totals.cancelled, color: '#ef4444' },
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
                              className="transition-opacity hover:opacity-80 cursor-pointer"
                            />
                            <text
                              x="100"
                              y="100"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="white"
                              fontSize="20"
                              fontWeight="700"
                            >
                              100%
                            </text>
                            <text
                              x="100"
                              y="120"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="white"
                              fontSize="12"
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
                            const labelRadius = radius * 0.65;
                            const labelX = centerX + labelRadius * Math.cos(labelRad);
                            const labelY = centerY + labelRadius * Math.sin(labelRad);
                            
                            currentAngle = endAngle;
                            
                            return (
                              <g key={index}>
                                <path
                                  d={pathData}
                                  fill={slice.color}
                                  className="transition-opacity hover:opacity-80 cursor-pointer"
                                />
                                {/* Percentage label */}
                                {percentage > 5 && (
                                  <text
                                    x={labelX}
                                    y={labelY}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill="white"
                                    fontSize="14"
                                    fontWeight="700"
                                  >
                                    {percentage.toFixed(0)}%
                                  </text>
                                )}
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                </div>

                {/* Statistics Summary */}
                <div className="grid grid-cols-2 gap-3 pt-4 sm:grid-cols-5">
                  {(() => {
                    const totals = bookingsData.reduce((acc, b) => ({
                      pending: acc.pending + b.pending,
                      confirmed: acc.confirmed + b.confirmed,
                      inProgress: acc.inProgress + b['in-progress'],
                      completed: acc.completed + b.completed,
                      cancelled: acc.cancelled + b.cancelled,
                    }), { pending: 0, confirmed: 0, inProgress: 0, completed: 0, cancelled: 0 });
                    
                    return (
                      <>
                        <div className="rounded-lg bg-yellow-50 p-3 text-center">
                          <div className="text-xs text-yellow-600">Chờ xác nhận</div>
                          <div className="text-xl font-semibold text-yellow-700">{totals.pending}</div>
                        </div>
                        <div className="rounded-lg bg-blue-50 p-3 text-center">
                          <div className="text-xs text-blue-600">Đã xác nhận</div>
                          <div className="text-xl font-semibold text-blue-700">{totals.confirmed}</div>
                        </div>
                        <div className="rounded-lg bg-purple-50 p-3 text-center">
                          <div className="text-xs text-purple-600">Đang thực hiện</div>
                          <div className="text-xl font-semibold text-purple-700">{totals.inProgress}</div>
                        </div>
                        <div className="rounded-lg bg-green-50 p-3 text-center">
                          <div className="text-xs text-green-600">Hoàn thành</div>
                          <div className="text-xl font-semibold text-green-700">{totals.completed}</div>
                        </div>
                        <div className="rounded-lg bg-red-50 p-3 text-center">
                          <div className="text-xs text-red-600">Đã hủy</div>
                          <div className="text-xl font-semibold text-red-700">{totals.cancelled}</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* User Distribution Chart */}
          <div className="lg:col-span-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">Phân bố người dùng theo vai trò</h2>
            
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Donut Chart */}
                <div className="relative mx-auto h-64 w-64">
                  <svg viewBox="0 0 200 200" className="h-full w-full">
                    {usersByRole.map((user, index) => {
                      const previousPercentages = usersByRole
                        .slice(0, index)
                        .reduce((sum, u) => sum + parseFloat(u.percentage), 0);
                      const percentage = parseFloat(user.percentage);
                      
                      // Calculate angles
                      const startAngle = (previousPercentages / 100) * 360 - 90; // -90 to start from top
                      const endAngle = ((previousPercentages + percentage) / 100) * 360 - 90;
                      
                      // Convert to radians
                      const startRad = (startAngle * Math.PI) / 180;
                      const endRad = (endAngle * Math.PI) / 180;
                      
                      // Arc parameters
                      const outerRadius = 85;
                      const innerRadius = 55;
                      const centerX = 100;
                      const centerY = 100;
                      
                      // Calculate points for outer arc
                      const x1 = centerX + outerRadius * Math.cos(startRad);
                      const y1 = centerY + outerRadius * Math.sin(startRad);
                      const x2 = centerX + outerRadius * Math.cos(endRad);
                      const y2 = centerY + outerRadius * Math.sin(endRad);
                      
                      // Calculate points for inner arc
                      const x3 = centerX + innerRadius * Math.cos(endRad);
                      const y3 = centerY + innerRadius * Math.sin(endRad);
                      const x4 = centerX + innerRadius * Math.cos(startRad);
                      const y4 = centerY + innerRadius * Math.sin(startRad);
                      
                      // Large arc flag
                      const largeArc = percentage > 50 ? 1 : 0;
                      
                      // Create path
                      const pathData = [
                        `M ${x1} ${y1}`,
                        `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}`,
                        `L ${x3} ${y3}`,
                        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
                        'Z'
                      ].join(' ');

                      return (
                        <path
                          key={user.role}
                          d={pathData}
                          fill={roleColors[user.role] || '#6b7280'}
                          className="transition-opacity hover:opacity-80"
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold text-gray-900">{totalUsers}</div>
                    <div className="text-sm text-gray-500">Tổng số</div>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-2 pt-4">
                  {usersByRole.map((user) => (
                    <div key={user.role} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2">
                      <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${roleBgColors[user.role] || 'bg-gray-500'}`}></div>
                        <span className="text-sm font-medium text-gray-700">{user.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{user.count}</span>
                        <span className="text-xs text-gray-500">({user.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;



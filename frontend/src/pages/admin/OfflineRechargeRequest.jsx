import React, { useEffect, useState } from 'react'
import { getPendingWalletRecharges, processWalletRechargeRequest } from '../../api/admin'
import Swal from 'sweetalert2'
import { Loader2, CheckCircle, XCircle, RefreshCw, Search } from 'lucide-react'

const OfflineRechargeRequest = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const { data } = await getPendingWalletRecharges()
      if (data?.ok) {
        // Filter to show only pending requests
        const pendingRequests = data.requests ? data.requests.filter(req => req.status === 'pending') : []
        setRequests(pendingRequests)
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const filteredRequests = requests.filter(req => 
    req.retailerId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.retailerId?.mobile?.includes(searchTerm) ||
    req.utr?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleStatusUpdate = async (id, status) => {
    const actionText = status === 'approved' ? 'Approve' : 'Reject';
    const confirmColor = status === 'approved' ? '#10B981' : '#EF4444';

    const result = await Swal.fire({
      title: `Are you sure?`,
      text: `You are about to ${actionText.toLowerCase()} this recharge request.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: confirmColor,
      cancelButtonColor: '#6B7280',
      confirmButtonText: `Yes, ${actionText} it!`
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Processing...',
          text: 'Please wait while we update the request.',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const payload = { 
          requestId: id, 
          status, 
          remarks: status === 'approved' ? 'Approved by Admin' : 'Rejected by Admin' 
        }
        
        const { data } = await processWalletRechargeRequest(payload)
        
        if (data?.ok) {
          await fetchRequests();
          Swal.fire(
            'Success!',
            `Request has been ${status}.`,
            'success'
          );
        } else {
          Swal.fire('Error', data?.message || 'Action failed', 'error');
        }
      } catch (error) {
        console.error('Error updating status:', error)
        Swal.fire('Error', 'Something went wrong while processing the request.', 'error');
      }
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <div className="text-gray-600 text-lg font-medium">Loading requests...</div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Offline Recharge Requests</h1>
            <p className="text-gray-500 mt-1">Manage and verify manual wallet recharge requests</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search retailer, UTR..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <button onClick={fetchRequests} className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors" title="Refresh List">
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredRequests.length === 0 ? (
            <div className="p-16 text-center">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No requests found</h3>
              <p className="text-gray-500 mt-1">There are no pending recharge requests matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sl No.</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Retailer Details</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Info</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request, index) => (
                    <tr key={request._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                        #{index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">
                            {request.retailerId?.name || 'Unknown'}
                          </span>
                          <span className="text-xs text-gray-500 mt-0.5">
                            {request.retailerId?.mobile}
                          </span>
                          <span className="text-xs text-blue-600 mt-0.5">
                            {request.retailerId?.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-base font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                          ₹{request.amount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-sm space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase w-10">Bank</span>
                            <span className="text-gray-800 font-medium">{request.bank}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase w-10">UTR</span>
                            <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded border border-gray-200 text-gray-700 select-all">{request.utr}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase w-10">Mode</span>
                            <span className="text-gray-800 capitalize">{request.mode}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{new Date(request.paymentDate || request.createdAt).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-400">{new Date(request.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200 uppercase tracking-wide">
                          {request.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleStatusUpdate(request._id, 'approved')}
                            className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 hover:shadow-md active:transform active:scale-95 transition-all text-xs font-bold"
                          >
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(request._id, 'rejected')}
                            className="flex items-center gap-1.5 bg-white text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 hover:border-red-300 active:transform active:scale-95 transition-all text-xs font-bold"
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OfflineRechargeRequest
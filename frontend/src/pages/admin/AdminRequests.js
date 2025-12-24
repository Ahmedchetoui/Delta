import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
    fetchAdminRequests,
    approveAdminRequest,
    rejectAdminRequest
} from '../../store/slices/adminRequestSlice';
import { adminService } from '../../services/api';
import {
    EyeIcon,
    CheckIcon,
    XMarkIcon,
    UserIcon,
    EnvelopeIcon,
    PhoneIcon,
    DocumentTextIcon,
    ClockIcon,
    UserPlusIcon,
    PaperAirplaneIcon
} from '@heroicons/react/24/outline';

const AdminRequests = () => {
    const dispatch = useDispatch();
    const { requests, loading, pagination } = useSelector((state) => state.adminRequests);

    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [reviewNotes, setReviewNotes] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');

    // Invite form state
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteFirstName, setInviteFirstName] = useState('');
    const [inviteLastName, setInviteLastName] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);

    useEffect(() => {
        dispatch(fetchAdminRequests({
            page: currentPage,
            status: statusFilter
        }));
    }, [dispatch, currentPage, statusFilter]);

    const handleApprove = async (requestId) => {
        try {
            await dispatch(approveAdminRequest({
                requestId,
                reviewNotes
            })).unwrap();
            toast.success('Demande approuvée avec succès');
            setShowModal(false);
            setReviewNotes('');
            dispatch(fetchAdminRequests({
                page: currentPage,
                status: statusFilter
            }));
        } catch (error) {
            toast.error(error || 'Erreur lors de l\'approbation');
        }
    };

    const handleReject = async (requestId) => {
        try {
            await dispatch(rejectAdminRequest({
                requestId,
                reviewNotes
            })).unwrap();
            toast.success('Demande rejetée');
            setShowModal(false);
            setReviewNotes('');
            dispatch(fetchAdminRequests({
                page: currentPage,
                status: statusFilter
            }));
        } catch (error) {
            toast.error(error || 'Erreur lors du rejet');
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail) {
            toast.error('L\'email est requis');
            return;
        }

        setInviteLoading(true);
        try {
            await adminService.inviteAdmin({
                email: inviteEmail,
                firstName: inviteFirstName,
                lastName: inviteLastName
            });
            toast.success(`Invitation envoyée à ${inviteEmail}`);
            setShowInviteModal(false);
            setInviteEmail('');
            setInviteFirstName('');
            setInviteLastName('');
        } catch (error) {
            console.error('Invite error:', error);
            toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi de l\'invitation');
        } finally {
            setInviteLoading(false);
        }
    };

    const openModal = (request) => {
        setSelectedRequest(request);
        setShowModal(true);
        setReviewNotes('');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending':
                return 'En attente';
            case 'approved':
                return 'Approuvée';
            case 'rejected':
                return 'Rejetée';
            default:
                return 'Inconnu';
        }
    };

    if (loading && !requests.length) {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-900">Demandes d'Administration</h1>

                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <PaperAirplaneIcon className="h-5 w-5" />
                        Inviter un admin
                    </button>

                    {/* Filtres */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="pending">En attente</option>
                        <option value="approved">Approuvées</option>
                        <option value="rejected">Rejetées</option>
                    </select>
                </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center">
                        <div className="p-3 bg-yellow-100 rounded-full">
                            <ClockIcon className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">En attente</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {requests.filter(r => r.status === 'pending').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-full">
                            <CheckIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Approuvées</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {requests.filter(r => r.status === 'approved').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center">
                        <div className="p-3 bg-red-100 rounded-full">
                            <XMarkIcon className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Rejetées</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {requests.filter(r => r.status === 'rejected').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Liste des demandes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Utilisateur
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Statut
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {requests.map((request) => (
                                <tr key={request._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold mr-3">
                                                {request.firstName?.charAt(0) || <UserIcon className="h-4 w-4" />}
                                            </div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {request.firstName} {request.lastName}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{request.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                                            {getStatusText(request.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {new Date(request.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openModal(request)}
                                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                title="Voir détails"
                                            >
                                                <EyeIcon className="h-5 w-5" />
                                            </button>
                                            {request.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRequest(request);
                                                            setShowModal(true);
                                                            setReviewNotes('');
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                                        title="Approuver"
                                                    >
                                                        <CheckIcon className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRequest(request);
                                                            setShowModal(true);
                                                            setReviewNotes('');
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                        title="Rejeter"
                                                    >
                                                        <XMarkIcon className="h-5 w-5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                                        Aucune demande trouvée
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                    <nav className="flex space-x-2">
                        <button
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={!pagination.hasPrev}
                            className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Précédent
                        </button>
                        <span className="px-3 py-2 bg-blue-600 text-white rounded-lg">
                            {pagination.currentPage} / {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={!pagination.hasNext}
                            className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Suivant
                        </button>
                    </nav>
                </div>
            )}

            {/* Modal de détail */}
            {showModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-auto animate-fadeIn">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                                <h3 className="text-xl font-bold text-gray-900">
                                    Détails de la demande
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                                    <UserIcon className="h-5 w-5 text-gray-500 mr-3 mt-1" />
                                    <div>
                                        <p className="text-sm text-gray-500">Demandeur</p>
                                        <p className="font-semibold text-gray-900 text-lg">
                                            {selectedRequest.firstName} {selectedRequest.lastName}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center p-3 border border-gray-100 rounded-lg">
                                        <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                                        <div>
                                            <p className="text-xs text-gray-500">Email</p>
                                            <p className="font-medium text-gray-900">{selectedRequest.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center p-3 border border-gray-100 rounded-lg">
                                        <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                                        <div>
                                            <p className="text-xs text-gray-500">Téléphone</p>
                                            <p className="font-medium text-gray-900">{selectedRequest.phone || 'Non renseigné'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 border border-gray-100 rounded-lg">
                                    <div className="flex items-center mb-2">
                                        <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                                        <p className="text-sm font-medium text-gray-700">Motivation</p>
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed">{selectedRequest.reason}</p>
                                </div>

                                <div className="text-xs text-gray-400 flex items-center">
                                    <ClockIcon className="h-4 w-4 mr-1" />
                                    Soumis le {new Date(selectedRequest.createdAt).toLocaleDateString('fr-FR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>

                                {selectedRequest.status !== 'pending' && selectedRequest.reviewNotes && (
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Notes de {selectedRequest.status === 'approved' ? 'validation' : 'refus'}</p>
                                        <p className="text-blue-900 text-sm">{selectedRequest.reviewNotes}</p>
                                    </div>
                                )}

                                {selectedRequest.status === 'pending' && (
                                    <div>
                                        <label htmlFor="reviewNotes" className="block text-sm font-medium text-gray-700 mb-2">
                                            Notes de décision (optionnel)
                                        </label>
                                        <textarea
                                            id="reviewNotes"
                                            value={reviewNotes}
                                            onChange={(e) => setReviewNotes(e.target.value)}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                                            placeholder="Expliquez votre décision..."
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Fermer
                                </button>
                                {selectedRequest.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleReject(selectedRequest._id)}
                                            className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                                        >
                                            Rejeter
                                        </button>
                                        <button
                                            onClick={() => handleApprove(selectedRequest._id)}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
                                        >
                                            Approuver la demande
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal d'invitation */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-auto animate-fadeIn">
                        <form onSubmit={handleInvite} className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <UserPlusIcon className="h-6 w-6 text-blue-600" />
                                    Inviter un administrateur
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                        Adresse email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        required
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="exemple@email.com"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                                            Prénom
                                        </label>
                                        <input
                                            type="text"
                                            id="firstName"
                                            value={inviteFirstName}
                                            onChange={(e) => setInviteFirstName(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Jean"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                                            Nom
                                        </label>
                                        <input
                                            type="text"
                                            id="lastName"
                                            value={inviteLastName}
                                            onChange={(e) => setInviteLastName(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Dupont"
                                        />
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                                    <p>Un email sera envoyé avec un lien d'invitation unique. Si l'utilisateur a déjà un compte, il pourra se connecter pour accepter. Sinon, il devra créer un compte.</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={inviteLoading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {inviteLoading ? (
                                        <>
                                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Envoi...
                                        </>
                                    ) : (
                                        <>
                                            <PaperAirplaneIcon className="h-4 w-4" />
                                            Envoyer l'invitation
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminRequests;

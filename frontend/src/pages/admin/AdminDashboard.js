import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    CurrencyDollarIcon,
    ShoppingBagIcon,
    UserGroupIcon,
    ChartBarIcon,
    ArrowTrendingUpIcon,
    ArchiveBoxIcon,
    TagIcon,
    MegaphoneIcon,
    ClipboardDocumentCheckIcon,
    ChartPieIcon
} from '@heroicons/react/24/outline';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { toast } from 'react-toastify';
import { adminService } from '../../services/api';

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30d');
    const [dashboardData, setDashboardData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadDashboard();
    }, [period]);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const { data } = await adminService.getDashboard(period);
            setDashboardData(data);
        } catch (error) {
            console.error('Erreur chargement dashboard:', error);
            toast.error("Impossible de charger les données du tableau de bord");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('fr-TN', {
            style: 'currency',
            currency: 'TND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('fr-TN').format(num);
    };

    if (loading && !dashboardData) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Couleurs pour les graphiques
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    const stats = [
        {
            title: "Produits",
            value: formatNumber(dashboardData?.summary?.totalProducts || 0),
            icon: ShoppingBagIcon,
            color: "bg-blue-500",
            bgColor: "bg-blue-100",
            textColor: "text-blue-600"
        },
        {
            title: "Commandes",
            value: formatNumber(dashboardData?.summary?.totalOrders || 0),
            icon: ClipboardDocumentCheckIcon,
            color: "bg-green-500",
            bgColor: "bg-green-100",
            textColor: "text-green-600"
        },
        {
            title: "Clients",
            value: formatNumber(dashboardData?.summary?.totalUsers || 0),
            icon: UserGroupIcon,
            color: "bg-purple-500",
            bgColor: "bg-purple-100",
            textColor: "text-purple-600"
        },
        {
            title: "Revenu Total",
            value: formatCurrency(dashboardData?.revenue?.totalRevenue || 0),
            icon: CurrencyDollarIcon,
            color: "bg-yellow-500",
            bgColor: "bg-yellow-100",
            textColor: "text-yellow-600"
        },
        {
            title: "Panier Moyen",
            value: formatCurrency(dashboardData?.revenue?.averageOrderValue || 0),
            icon: ArrowTrendingUpIcon,
            color: "bg-indigo-500",
            bgColor: "bg-indigo-100",
            textColor: "text-indigo-600"
        },
        {
            title: "Catégories",
            value: formatNumber(dashboardData?.summary?.totalCategories || 0),
            icon: TagIcon,
            color: "bg-pink-500",
            bgColor: "bg-pink-100",
            textColor: "text-pink-600"
        }
    ];

    // Préparer les données pour le graphique de commandes par statut
    const orderStatusData = dashboardData?.orderStats?.byStatus?.map(item => ({
        name: item._id === 'pending' ? 'En attente' :
            item._id === 'processing' ? 'Traitement' :
                item._id === 'shipped' ? 'Expédié' :
                    item._id === 'delivered' ? 'Livré' :
                        item._id === 'cancelled' ? 'Annulé' : item._id,
        value: item.count
    })) || [];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
                    <p className="text-gray-500 mt-1">Vue d'ensemble de votre boutique</p>
                </div>

                <div className="flex items-center gap-4">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="7d">7 derniers jours</option>
                        <option value="30d">30 derniers jours</option>
                        <option value="90d">3 derniers mois</option>
                        <option value="1y">1 an</option>
                    </select>

                    <button
                        onClick={() => navigate('/admin/analytics')}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg transform hover:-translate-y-0.5"
                    >
                        <ChartBarIcon className="w-5 h-5" />
                        Analytics Power BI
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-sm p-6 transform hover:scale-105 transition duration-300 border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                            </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium">{stat.title}</h3>
                        <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <ArrowTrendingUpIcon className="w-5 h-5 text-blue-500" />
                        Évolution du Chiffre d'Affaires
                    </h2>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dashboardData?.monthlyStats || []}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis
                                    dataKey="_id"
                                    tickFormatter={(item) => typeof item === 'string' ? item : `${item.month}/${item.year}`}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(value) => `${value / 1000}k`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => formatCurrency(value)}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#3B82F6"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Order Status Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <ChartPieIcon className="w-5 h-5 text-purple-500" />
                        État des Commandes
                    </h2>
                    <div className="h-64 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={orderStatusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {orderStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] text-center">
                            <span className="text-3xl font-bold text-gray-800">{dashboardData?.summary?.totalOrders}</span>
                            <p className="text-xs text-gray-500">Total</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Top Products */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800">Top Produits</h2>
                        <Link to="/admin/products" className="text-sm text-blue-600 hover:text-blue-800 font-medium">Voir tout</Link>
                    </div>
                    <div className="p-0">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ventes</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenu</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {dashboardData?.topProducts?.slice(0, 5).map((product, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {product.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                                            {product.totalSold}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                                            {formatCurrency(product.totalRevenue || product.price * product.totalSold)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Clients */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800">Meilleurs Clients</h2>
                        <Link to="/admin/customers" className="text-sm text-blue-600 hover:text-blue-800 font-medium">Voir tout</Link>
                    </div>
                    <div className="p-0">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Commandes</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {dashboardData?.topUsers?.slice(0, 5).map((user, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                                                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                                            {user.orderCount}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                                            {formatCurrency(user.totalSpent)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <h2 className="text-xl font-bold text-gray-900 mb-4">Actions Rapides</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                    { to: "/admin/products/new", icon: ShoppingBagIcon, label: "Nouveau Produit", color: "bg-blue-600" },
                    { to: "/admin/orders", icon: ClipboardDocumentCheckIcon, label: "Gérer Commandes", color: "bg-green-600" },
                    { to: "/admin/categories", icon: TagIcon, label: "Catégories", color: "bg-purple-600" },
                    { to: "/admin/banners", icon: MegaphoneIcon, label: "Bannières", color: "bg-pink-600" },
                    { to: "/admin/customers", icon: UserGroupIcon, label: "Clients", color: "bg-indigo-600" },
                    { to: "/admin/requests", icon: ArchiveBoxIcon, label: "Demandes Admin", color: "bg-orange-600" },
                ].map((action, idx) => (
                    <Link
                        key={idx}
                        to={action.to}
                        className={`${action.color} text-white p-4 rounded-xl shadow-md hover:opacity-90 transition transform hover:-translate-y-1 flex flex-col items-center justify-center text-center gap-2`}
                    >
                        <action.icon className="w-8 h-8" />
                        <span className="font-medium text-sm">{action.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default AdminDashboard;

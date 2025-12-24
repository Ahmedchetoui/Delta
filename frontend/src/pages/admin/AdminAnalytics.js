import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
    ArrowDownTrayIcon,
    FunnelIcon,
    ArrowPathIcon,
    CurrencyDollarIcon,
    ShoppingCartIcon,
    UserGroupIcon,
    ArchiveBoxIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { adminService } from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-toastify';

const AdminAnalytics = () => {
    const [activeTab, setActiveTab] = useState('sales'); // sales, products, customers
    const [period, setPeriod] = useState('30d');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);

    // Common Colors
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    useEffect(() => {
        fetchAnalytics();
    }, [activeTab, period]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            let response;
            if (activeTab === 'sales') {
                response = await adminService.getSalesAnalytics({ period });
            } else if (activeTab === 'products') {
                response = await adminService.getProductsAnalytics(period);
            } else if (activeTab === 'customers') {
                response = await adminService.getCustomersAnalytics(period);
            }
            setData(response.data);
        } catch (error) {
            console.error('Analytics error:', error);
            toast.error("Erreur de chargement des données analytiques");
        } finally {
            setLoading(false);
        }
    };

    const exportData = () => {
        if (!data) return;

        // Simple CSV export logic based on active tab
        const csvContent = "data:text/csv;charset=utf-8," +
            (activeTab === 'sales' ? "Date,Revenu,Commandes\n" + data.salesOverTime?.map(row => `${row._id},${row.revenue},${row.orders}`).join("\n") :
                activeTab === 'products' ? "Produit,Ventes,Revenu\n" + data.topProducts?.map(row => `${row.name},${row.totalSold},${row.totalRevenue}`).join("\n") :
                    "Client,Dépenses,Commandes\n" + data.topCustomers?.map(row => `${row.firstName} ${row.lastName},${row.totalSpent},${row.orderCount}`).join("\n"));

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `analytics_${activeTab}_${period}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    const formatCurrency = (val) => new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(val);

    // Components for each tab
    const SalesTab = () => (
        <div className="space-y-6 animate-fadeIn">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm">Revenu Total</p>
                            <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(data?.totalRevenue || 0)}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <CurrencyDollarIcon className="h-6 w-6" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm">Commandes</p>
                            <h3 className="text-2xl font-bold text-gray-800">{data?.totalOrders || 0}</h3>
                        </div>
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <ShoppingCartIcon className="h-6 w-6" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm">Panier Moyen</p>
                            <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(data?.averageOrderValue || 0)}</h3>
                        </div>
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <FunnelIcon className="h-6 w-6" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm">Jours Analysés</p>
                            <h3 className="text-2xl font-bold text-gray-800">{data?.salesOverTime?.length || 0}</h3>
                        </div>
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <ArrowPathIcon className="h-6 w-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Évolution du Chiffre d'Affaires</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data?.salesOverTime}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="_id" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Area type="monotone" dataKey="revenue" stroke="#8884d8" fillOpacity={1} fill="url(#colorRevenue)" name="Revenu" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Commandes par Jour</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data?.salesOverTime}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="_id" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="orders" fill="#82ca9d" name="Commandes" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">Détail des Transactions</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenu</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Commandes</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Moyenne</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data?.salesOverTime?.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-900">{row._id}</td>
                                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{formatCurrency(row.revenue)}</td>
                                    <td className="px-6 py-4 text-right text-sm text-gray-500">{row.orders}</td>
                                    <td className="px-6 py-4 text-right text-sm text-gray-500">{formatCurrency(row.revenue / row.orders || 0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const ProductsTab = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-xs uppercase">Total Produits</p>
                    <h3 className="text-xl font-bold">{data?.totalProducts || 0}</h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-xs uppercase">Stock Total</p>
                    <h3 className="text-xl font-bold">{data?.totalStock || 0}</h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-xs uppercase">Vues Totales</p>
                    <h3 className="text-xl font-bold text-blue-600">{data?.totalViews || 0}</h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-xs uppercase">Vendus</p>
                    <h3 className="text-xl font-bold text-green-600">{data?.totalSold || 0}</h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-xs uppercase">Faible Stock</p>
                    <h3 className="text-xl font-bold text-red-600">{data?.lowStockCount || 0}</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Répartition par Type</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={[
                                    { name: 'Actifs', value: data?.totalProducts || 0 }, // Using total for demo, ideally status breakdown
                                    { name: 'En Vedette', value: data?.featuredCount || 0 },
                                    { name: 'Nouveautés', value: data?.newCount || 0 },
                                    { name: 'En Promo', value: data?.onSaleCount || 0 }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {COLORS.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Top 5 Produits (Ventes)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={data?.topProducts?.slice(0, 5)}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(value) => [value, "Unités"]} />
                            <Bar dataKey="totalSold" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Out of Stock Alert */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 bg-red-50 border-b border-red-100 flex items-center gap-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                        <h3 className="font-bold text-red-800">Rupture de Stock</h3>
                    </div>
                    <div className="p-4 max-h-80 overflow-y-auto">
                        {data?.outOfStock?.length > 0 ? (
                            <ul className="space-y-3">
                                {data.outOfStock.map(p => (
                                    <li key={p._id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                        <span className="text-sm font-medium text-gray-700">{p.name}</span>
                                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">0</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 text-sm text-center py-4">Aucun produit en rupture</p>
                        )}
                    </div>
                </div>

                {/* Low Stock Alert */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 bg-orange-50 border-b border-orange-100 flex items-center gap-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
                        <h3 className="font-bold text-orange-800">Stock Faible</h3>
                    </div>
                    <div className="p-4 max-h-80 overflow-y-auto">
                        {data?.lowStock?.length > 0 ? (
                            <ul className="space-y-3">
                                {data.lowStock.map(p => (
                                    <li key={p._id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                        <span className="text-sm font-medium text-gray-700">{p.name}</span>
                                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">{p.stock}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 text-sm text-center py-4">Aucun produit en stock faible</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const CustomersTab = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                    <h3 className="text-2xl font-bold text-gray-800">{data?.totalUsers || 0}</h3>
                    <p className="text-gray-500 text-sm">Total Clients</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                    <h3 className="text-2xl font-bold text-green-600">{data?.activeUsers || 0}</h3>
                    <p className="text-gray-500 text-sm">Clients Actifs</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                    <h3 className="text-2xl font-bold text-blue-600">{data?.newCustomers || 0}</h3>
                    <p className="text-gray-500 text-sm">Nouveaux ce mois</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Top 10 Clients (Chiffre d'Affaires)</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.topCustomers}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="firstName" />
                        <YAxis />
                        <Tooltip cursor={{ fill: '#f3f4f6' }} formatter={(value) => formatCurrency(value)} />
                        <Bar dataKey="totalSpent" fill="#8884d8" name="Total Dépensé" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">Détail Clients (Top 20)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Commandes</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Dépensé</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data?.topCustomers?.map((user, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                                    <td className="px-6 py-4 text-right text-sm text-gray-900">{user.orderCount}</td>
                                    <td className="px-6 py-4 text-right text-sm font-bold text-blue-600">{formatCurrency(user.totalSpent)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <button onClick={() => window.history.back()} className="text-gray-400 hover:text-gray-600">
                            ← Retour
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">Analytics Power BI</h1>
                    </div>
                    <p className="text-gray-500">Analyse approfondie de vos données</p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="7d">7 derniers jours</option>
                        <option value="30d">30 derniers jours</option>
                        <option value="90d">3 derniers mois</option>
                        <option value="1y">1 an</option>
                    </select>

                    <button
                        onClick={fetchAnalytics}
                        className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
                        title="Actualiser"
                    >
                        <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                        onClick={exportData}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-sm"
                    >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                        <span className="hidden sm:inline">Exporter CSV</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm mb-8">
                <div className="flex border-b border-gray-100 overflow-x-auto">
                    {['sales', 'products', 'customers'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-4 px-6 text-sm font-medium text-center border-b-2 transition-colors whitespace-nowrap ${activeTab === tab
                                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {tab === 'sales' && '📊 Ventes & Revenus'}
                            {tab === 'products' && '🛍️ Produits & Stock'}
                            {tab === 'customers' && '👥 Clients & Fidélité'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {loading && !data ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <>
                    {activeTab === 'sales' && <SalesTab />}
                    {activeTab === 'products' && <ProductsTab />}
                    {activeTab === 'customers' && <CustomersTab />}
                </>
            )}
        </div>
    );
};

export default AdminAnalytics;

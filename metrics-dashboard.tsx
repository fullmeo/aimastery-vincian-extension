import React, { useState, useEffect } from 'react';
import { TrendingUp, Code, Layers, Zap, Award, Clock, Users, Coins } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

export default function MetricsDashboard() {
  const [animatedValues, setAnimatedValues] = useState({
    globalScore: 0,
    harmony: 0,
    complexity: 0,
    performance: 0
  });

  // Animation des valeurs au chargement
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValues({
        globalScore: 94,
        harmony: 98,
        complexity: 87,
        performance: 91
      });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Données pour les graphiques
  const evolutionData = [
    { month: 'Jan', score: 72, ideal: 85 },
    { month: 'Fév', score: 78, ideal: 86 },
    { month: 'Mar', score: 82, ideal: 87 },
    { month: 'Avr', score: 85, ideal: 88 },
    { month: 'Mai', score: 89, ideal: 90 },
    { month: 'Jun', score: 94, ideal: 92 }
  ];

  const fibonacciData = [
    { name: 'Fonctions', value: 89, fibonacci: 89 },
    { name: 'Classes', value: 55, fibonacci: 55 },
    { name: 'Modules', value: 34, fibonacci: 34 },
    { name: 'Lignes/Fonction', value: 21, fibonacci: 21 },
    { name: 'Complexité', value: 13, fibonacci: 13 }
  ];

  const vincianPrinciples = [
    { principle: 'Proportion', score: 95 },
    { principle: 'Symétrie', score: 88 },
    { principle: 'Hiérarchie', score: 92 },
    { principle: 'Mouvement', score: 85 },
    { principle: 'Lumière', score: 90 },
    { principle: 'Anatomie', score: 87 }
  ];

  const pieData = [
    { name: 'Excellence', value: 45, color: '#10b981' },
    { name: 'Bon', value: 35, color: '#3b82f6' },
    { name: 'Acceptable', value: 15, color: '#f59e0b' },
    { name: 'À améliorer', value: 5, color: '#ef4444' }
  ];

  const rewardsData = [
    { day: 'Lun', earned: 45, burned: 5 },
    { day: 'Mar', earned: 52, burned: 8 },
    { day: 'Mer', earned: 48, burned: 6 },
    { day: 'Jeu', earned: 70, burned: 10 },
    { day: 'Ven', earned: 85, burned: 12 },
    { day: 'Sam', earned: 65, burned: 9 },
    { day: 'Dim', earned: 55, burned: 7 }
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Dashboard Vincien</h1>
              <p className="text-gray-600 mt-1">Analyse en temps réel de votre code selon les principes de Léonard de Vinci</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Dernière analyse</p>
                <p className="text-lg font-semibold text-gray-800">Il y a 2 min</p>
              </div>
              <button className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow">
                Nouvelle Analyse
              </button>
            </div>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {[
            { 
              label: 'Score Global', 
              value: animatedValues.globalScore, 
              icon: Award, 
              color: 'from-purple-500 to-pink-500',
              suffix: '/100'
            },
            { 
              label: 'Harmonie', 
              value: animatedValues.harmony, 
              icon: Layers, 
              color: 'from-blue-500 to-cyan-500',
              suffix: '%'
            },
            { 
              label: 'Complexité', 
              value: animatedValues.complexity, 
              icon: Code, 
              color: 'from-green-500 to-emerald-500',
              suffix: ' pts'
            },
            { 
              label: 'Performance', 
              value: animatedValues.performance, 
              icon: Zap, 
              color: 'from-yellow-500 to-orange-500',
              suffix: '%'
            }
          ].map((metric, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform">
              <div className={`bg-gradient-to-r ${metric.color} p-3 rounded-lg inline-flex mb-4`}>
                <metric.icon className="h-6 w-6 text-white" />
              </div>
              <p className="text-gray-600 text-sm">{metric.label}</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                <span style={{ transition: 'all 1s ease-out' }}>
                  {metric.value}
                </span>
                <span className="text-lg text-gray-500">{metric.suffix}</span>
              </p>
            </div>
          ))}
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Évolution temporelle */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
              Évolution du Score Vincien
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={evolutionData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  labelStyle={{ color: '#111827', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="ideal" stroke="#fbbf24" fill="#fef3c7" strokeWidth={2} />
                <Area type="monotone" dataKey="score" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Radar des principes vinciens */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Principes Vinciens</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={vincianPrinciples}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="principle" stroke="#6b7280" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6b7280" />
                <Radar name="Score" dataKey="score" stroke="#f59e0b" fill="#fbbf24" fillOpacity={0.6} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Métriques Fibonacci et Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Analyse Fibonacci */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Métriques Fibonacci</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={fibonacciData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" width={100} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                <Bar dataKey="fibonacci" fill="#fbbf24" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribution de qualité */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Distribution de Qualité</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {pieData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: item.color }}></div>
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-800">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Récompenses $MLDY */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Coins className="h-5 w-5 mr-2 text-yellow-500" />
              Récompenses $MLDY
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={rewardsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Bar dataKey="earned" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="burned" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Statistiques en temps réel */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Fichiers analysés', value: '1,234', icon: Code },
              { label: 'Utilisateurs actifs', value: '567', icon: Users },
              { label: 'Tokens distribués', value: '45.2K', icon: Coins },
              { label: 'Temps moyen', value: '0.8s', icon: Clock }
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <stat.icon className="h-8 w-8 mx-auto mb-2 opacity-80" />
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm opacity-80 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
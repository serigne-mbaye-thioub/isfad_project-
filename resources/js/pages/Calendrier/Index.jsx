import React, { useState, useEffect } from 'react';
import api from '../../axios';
import { 
    ChevronLeft, ChevronRight, CheckCircle2, Phone, Flag, Circle, CalendarDays
} from 'lucide-react';

const Calendrier = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null); // Nouveau state

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/calendrier');
            setEvents(Array.isArray(res.data) ? res.data : (res.data.data || []));
        } catch (e) {
            console.error("Erreur chargement calendrier", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    // Helper functions for calendar
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => {
        let day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // 0 = Lundi, 6 = Dimanche
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();

    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const handleToday = () => {
        setCurrentDate(new Date());
        setSelectedDate(null);
    };

    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    
    // Obtenir la date normalisée 'YYYY-MM-DD'
    const getFormattedDate = (y, m, d) => {
        return `${y}-${String(m+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    };
    const todayFormatted = getFormattedDate(today.getFullYear(), today.getMonth(), today.getDate());

    // Date affichée dans le panneau de droite
    const displayDate = selectedDate || todayFormatted;

    // Génération des jours de la grille
    const calendarCells = [];
    for (let i = 0; i < firstDay; i++) {
        calendarCells.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        calendarCells.push(i);
    }

    // Filtrage pour la grille
    const getEventsForDate = (day) => {
        const d = getFormattedDate(year, month, day);
        return events.filter(e => e.date === d);
    };

    // Obtenir l'icône/couleur par type
    const getEventBadge = (type) => {
        switch(type) {
            case 'tache': return <CheckCircle2 size={12} className="text-emerald-500" />;
            case 'reunion': return <Phone size={12} className="text-rose-500" />;
            case 'jalon': return <Flag size={12} className="text-red-500" />;
            default: return <Circle size={12} className="text-gray-400" />;
        }
    };

    // Récapitulatifs
    const displayedEvents = events.filter(e => e.date === displayDate);
    const upcomingEvents = events.filter(e => e.date > todayFormatted).slice(0, 5); // 5 prochains

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                    <CalendarDays size={24} className="text-[#0564A8]" />
                    Calendrier des échéances
                </h1>
                <span className="text-sm font-bold text-gray-500 capitalize">
                    {today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Grille Calendrier (2/3) */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
                        
                        {/* Header calendrier */}
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-bold text-gray-900">
                                {monthNames[month]} {year}
                            </h2>
                            <div className="flex items-center gap-2">
                                <button onClick={handlePrevMonth} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition">
                                    <ChevronLeft size={18} />
                                </button>
                                <button onClick={handleToday} className="px-4 py-2 border border-[#0564A8] text-[#0564A8] rounded-lg text-sm font-bold hover:bg-blue-50 transition">
                                    Aujourd'hui
                                </button>
                                <button onClick={handleNextMonth} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition">
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Jours de la semaine */}
                        <div className="grid grid-cols-7 mb-2">
                            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                                <div key={d} className="text-center text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Grille */}
                        <div className="grid grid-cols-7 gap-2 flex-1">
                            {calendarCells.map((day, idx) => {
                                if (day === null) {
                                    return <div key={`empty-${idx}`} className="bg-gray-50/50 rounded-xl min-h-[80px]"></div>;
                                }
                                
                                const cellDate = getFormattedDate(year, month, day);
                                const isToday = cellDate === todayFormatted;
                                const isPast = cellDate < todayFormatted;
                                const isSelected = cellDate === selectedDate;
                                const dayEvents = getEventsForDate(day);

                                return (
                                    <div 
                                        key={`day-${day}`} 
                                        onClick={() => setSelectedDate(cellDate)}
                                        className={`
                                        rounded-xl p-2 min-h-[80px] border flex flex-col transition cursor-pointer relative
                                        ${isToday && !isSelected ? 'bg-blue-50/30 border-blue-200 shadow-sm z-10' : ''}
                                        ${isSelected ? 'bg-[#0564A8] text-white border-[#0564A8] shadow-md transform scale-[1.02] z-20' : 'bg-gray-50 hover:border-[#0564A8]/40 hover:bg-white'}
                                        ${isPast && !isToday && !isSelected ? 'opacity-60' : ''}
                                    `}>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? (isSelected ? 'bg-white text-[#0564A8]' : 'bg-[#0564A8] text-white shadow-sm') : (isSelected ? 'text-white' : 'text-gray-700')}`}>
                                                {day}
                                            </span>
                                            {isToday && <span className="text-[9px] font-black uppercase tracking-wider text-[#0564A8] opacity-80 mt-1">Auj.</span>}
                                        </div>
                                        <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                                            {dayEvents.map(e => (
                                                <div 
                                                    key={e.id} 
                                                    title={`${e.titre} (${e.projet_titre})`}
                                                    className={`
                                                        w-5 h-5 flex items-center justify-center rounded-full bg-white shrink-0 shadow-sm border
                                                        ${isToday ? 'border-white/20' : 'border-gray-100'}
                                                    `}
                                                >
                                                    {getEventBadge(e.type)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Légende sous le calendrier */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-4 py-3 px-6 flex flex-wrap items-center gap-6 text-xs font-bold text-gray-600">
                        <span className="text-gray-400 uppercase tracking-wider">Légende :</span>
                        <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Tâche</div>
                        <div className="flex items-center gap-2"><Flag size={14} className="text-red-500" /> Jalon</div>
                        <div className="flex items-center gap-2"><Phone size={14} className="text-rose-500" /> Réunion</div>
                        <div className="w-px h-4 bg-gray-200"></div>
                        <div className="flex items-center gap-2"><Circle size={10} className="text-gray-400 fill-gray-400" /> Passé</div>
                        <div className="flex items-center gap-2"><Circle size={10} className="text-amber-500 fill-amber-500" /> Aujourd'hui</div>
                        <div className="flex items-center gap-2"><Circle size={10} className="text-emerald-500 fill-emerald-500" /> À venir</div>
                    </div>
                </div>

                {/* Récapitulatif (1/3) */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    
                    {/* Bloc Échéances du jour sélectionné */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col min-h-[150px]">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                            <h3 className="text-lg font-bold text-gray-900">
                                {!selectedDate ? "Aujourd'hui" : `Échéances du ${new Date(selectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                            </h3>
                            {selectedDate && (
                                <button onClick={() => setSelectedDate(null)} className="text-xs font-bold text-[#0564A8] hover:underline">
                                    Retour à aujourd'hui
                                </button>
                            )}
                        </div>
                        {loading ? (
                            <div className="animate-pulse space-y-3"><div className="h-4 bg-gray-100 rounded w-full"></div><div className="h-4 bg-gray-100 rounded w-2/3"></div></div>
                        ) : displayedEvents.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-sm font-medium text-gray-400 italic">
                                Aucune échéance ce jour-là.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {displayedEvents.map(e => (
                                    <div key={e.id} className="flex items-start gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                        <div className="bg-white p-1.5 rounded-full shadow-sm">{getEventBadge(e.type)}</div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 line-clamp-1">{e.titre}</p>
                                            <p className="text-xs font-medium text-gray-500 line-clamp-1">{e.projet_titre}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Bloc Prochaines échéances */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">Prochaines échéances</h3>
                        {loading ? (
                            <div className="animate-pulse space-y-3"><div className="h-4 bg-gray-100 rounded w-full"></div><div className="h-4 bg-gray-100 rounded w-2/3"></div></div>
                        ) : upcomingEvents.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-sm font-medium text-gray-400 italic py-10">
                                Aucune échéance à venir.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {upcomingEvents.map(e => {
                                    const diffDays = Math.ceil((new Date(e.date) - today) / (1000 * 60 * 60 * 24));
                                    return (
                                        <div key={e.id} className="flex items-start gap-3 group">
                                            <div className="bg-gray-50 p-1.5 rounded-full border border-gray-100 group-hover:bg-white group-hover:shadow-sm transition">
                                                {getEventBadge(e.type)}
                                            </div>
                                            <div className="flex-1 border-b border-gray-50 pb-3 group-hover:border-transparent transition">
                                                <p className="text-sm font-bold text-gray-800 line-clamp-1 leading-tight mb-1">{e.titre}</p>
                                                <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                                    <span>{e.date}</span>
                                                    <span>·</span>
                                                    <span className={diffDays <= 3 ? 'text-amber-600 font-bold' : ''}>dans {diffDays} j</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Calendrier;

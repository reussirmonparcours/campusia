"use client";

import * as React from "react";
import { ExamTimelinePoint, ExamSubjectPerformance } from "@/types/exam";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Info } from "lucide-react";

interface PerformanceTimelineProps {
  timeline: ExamTimelinePoint[];
  bySubject: Record<string, ExamSubjectPerformance>;
}

export function PerformanceTimeline({ timeline, bySubject }: PerformanceTimelineProps) {
  const [selectedSubject, setSelectedSubject] = React.useState<string>("all");
  const [hoveredPoint, setHoveredPoint] = React.useState<{
    index: number;
    point: ExamTimelinePoint;
    x: number;
    y: number;
  } | null>(null);

  const subjectsList = React.useMemo(() => {
    return Object.entries(bySubject).map(([id, data]) => ({
      id,
      name: data.subjectName,
      count: data.simulationsCount,
    }));
  }, [bySubject]);

  // Filtrer la timeline selon la matière sélectionnée
  const filteredTimeline = React.useMemo(() => {
    if (selectedSubject === "all") return timeline;
    return timeline.filter((point) => {
      const subj = subjectsList.find((s) => s.id === selectedSubject);
      return subj ? point.subjectName === subj.name : true;
    });
  }, [timeline, selectedSubject, subjectsList]);

  // État vide ou moins de 2 points pour une courbe
  if (timeline.length < 2) {
    return (
      <Card className="border-border-default bg-surface-base shadow-subtle">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-navy-900" />
            <CardTitle>Évolution de vos performances</CardTitle>
          </div>
          <CardDescription>
            Visualisez la progression de vos notes au fil des épreuves passées.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center rounded-lg border border-dashed border-border-default bg-surface-muted/30">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-navy-50 text-navy-800 mb-3">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-navy-950">
              Pas encore assez de simulations pour afficher ton évolution.
            </p>
            <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
              Complétez au moins deux simulations d&apos;examen blanc pour tracer votre courbe de progression.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Dimensions SVG normalisées
  const width = 600;
  const height = 220;
  const padding = { top: 20, right: 30, bottom: 40, left: 40 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Calcul des coordonnées
  const points = filteredTimeline.map((item, index) => {
    const x =
      filteredTimeline.length > 1
        ? padding.left + (index / (filteredTimeline.length - 1)) * graphWidth
        : padding.left + graphWidth / 2;
    // Score de 0 à 100%
    const y = padding.top + graphHeight - (item.percentage / 100) * graphHeight;
    return { ...item, x, y };
  });

  // Construction du chemin SVG (Line)
  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, "");

  // Construction du chemin pour le remplissage sous la courbe (Area)
  const areaD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x},${padding.top + graphHeight} L ${points[0].x},${padding.top + graphHeight} Z`
      : "";

  return (
    <Card className="border-border-default bg-surface-base shadow-subtle overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-navy-900" />
            <CardTitle>Évolution de vos performances</CardTitle>
          </div>
          <CardDescription>
            Historique chronologique des pourcentages obtenus aux simulations
          </CardDescription>
        </div>

        {/* Filtre par matière (optionnel & accessible) */}
        {subjectsList.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-xs text-text-secondary sr-only">Filtrer par matière :</span>
            <button
              type="button"
              onClick={() => {
                setSelectedSubject("all");
                setHoveredPoint(null);
              }}
              className={`px-3 py-1 text-xs rounded-pill font-medium transition-colors whitespace-nowrap min-h-[32px] ${
                selectedSubject === "all"
                  ? "bg-navy-900 text-white"
                  : "bg-surface-muted text-text-secondary hover:text-navy-950"
              }`}
            >
              Toutes ({timeline.length})
            </button>
            {subjectsList.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSelectedSubject(s.id);
                  setHoveredPoint(null);
                }}
                className={`px-3 py-1 text-xs rounded-pill font-medium transition-colors whitespace-nowrap min-h-[32px] ${
                  selectedSubject === s.id
                    ? "bg-navy-900 text-white"
                    : "bg-surface-muted text-text-secondary hover:text-navy-950"
                }`}
              >
                {s.name} ({s.count})
              </button>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {filteredTimeline.length < 2 ? (
          <div className="p-6 text-center text-xs text-text-secondary bg-surface-muted/30 rounded-lg">
            Pas encore assez de simulations enregistrées dans cette matière pour afficher une courbe.
          </div>
        ) : (
          <div className="relative w-full">
            {/* Zone graphique SVG responsive */}
            <div className="w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-auto max-h-[260px] select-none"
                role="img"
                aria-label="Graphique d'évolution chronologique des scores d'examen"
              >
                <defs>
                  <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Lignes de repère horizontales (25%, 50%, 75%, 100%) */}
                {[0, 25, 50, 75, 100].map((pct) => {
                  const y = padding.top + graphHeight - (pct / 100) * graphHeight;
                  return (
                    <g key={pct}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={width - padding.right}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeDasharray={pct === 50 ? "4 4" : "2 2"}
                        strokeWidth="1"
                      />
                      <text
                        x={padding.left - 8}
                        y={y + 3}
                        textAnchor="end"
                        fontSize="10"
                        fill="#94a3b8"
                        className="font-mono"
                      >
                        {pct}%
                      </text>
                    </g>
                  );
                })}

                {/* Remplissage dégradé sous la courbe */}
                <path d={areaD} fill="url(#curveGradient)" />

                {/* Ligne de connexion principale */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#1e3a8a"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Points interactifs */}
                {points.map((pt, idx) => {
                  const isHovered = hoveredPoint?.index === idx;
                  return (
                    <g key={idx}>
                      {/* Zone tactile élargie pour mobile (>= 44px) */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="22"
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPoint({ index: idx, point: pt, x: pt.x, y: pt.y })}
                        onTouchStart={() => setHoveredPoint({ index: idx, point: pt, x: pt.x, y: pt.y })}
                        tabIndex={0}
                        aria-label={`${pt.subjectName}, ${pt.date} : ${pt.percentage}%`}
                        onFocus={() => setHoveredPoint({ index: idx, point: pt, x: pt.x, y: pt.y })}
                        onBlur={() => setHoveredPoint(null)}
                      />

                      {/* Point visible */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? "6" : "4"}
                        fill={isHovered ? "#b45309" : "#1e3a8a"}
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="transition-all duration-150 pointer-events-none"
                      />

                      {/* Libellé date sous l'axe X */}
                      <text
                        x={pt.x}
                        y={height - 12}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#64748b"
                        className="pointer-events-none"
                      >
                        {pt.date}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Bulle d'information interactive (Tooltip) */}
            {hoveredPoint && (
              <div
                className="absolute z-10 bg-navy-950 text-white rounded-lg p-2.5 text-xs shadow-large pointer-events-none transition-all duration-150 -translate-x-1/2 -translate-y-full border border-navy-800"
                style={{
                  left: `${(hoveredPoint.x / width) * 100}%`,
                  top: `${Math.max(10, (hoveredPoint.y / height) * 100 - 8)}%`,
                }}
              >
                <div className="font-semibold text-gold-300">
                  {hoveredPoint.point.percentage}%
                </div>
                <div className="text-slate-300 text-[11px] truncate max-w-[160px]">
                  {hoveredPoint.point.subjectName}
                </div>
                <div className="text-slate-400 text-[10px] mt-0.5 flex items-center gap-1">
                  <span>{hoveredPoint.point.date}</span>
                  {hoveredPoint.point.status && (
                    <span>• {hoveredPoint.point.status === "expired" ? "Expiré" : "Soumis"}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tableau accessible aux lecteurs d'écran (Accessibilité Section 16) */}
        <div className="sr-only">
          <table>
            <caption>Historique chronologique des scores aux simulations d&apos;examen</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Matière</th>
                <th scope="col">Pourcentage</th>
                <th scope="col">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredTimeline.map((pt, idx) => (
                <tr key={idx}>
                  <td>{pt.date}</td>
                  <td>{pt.subjectName}</td>
                  <td>{pt.percentage}%</td>
                  <td>{pt.status === "expired" ? "Expiré" : "Soumis"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Récapitulatif textuel sous le graphique */}
        <div className="flex items-center justify-between text-xs text-text-secondary pt-2 border-t border-border-subtle">
          <span className="flex items-center gap-1">
            <Info className="h-3.5 w-3.5 text-text-muted" />
            Pourcentage calculé sur la base de la note obtenue par rapport au barème.
          </span>
          <span className="font-mono text-text-muted">
            {filteredTimeline.length} point{filteredTimeline.length > 1 ? "s" : ""}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

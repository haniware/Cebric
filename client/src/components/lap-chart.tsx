import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { F1SessionResponse } from "@shared/schema";

interface LapChartProps {
  sessionData: F1SessionResponse | null;
  onLapSelect: (driver: string, lap: number) => void;
  timeFormat?: 'seconds' | 'minutes';
}

export default function LapChart({ sessionData, onLapSelect }: LapChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleExport = () => {
    if (chartInstanceRef.current && canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `lap-chart-${new Date().getTime()}.png`;
      link.href = url;
      link.click();
    }
  };

  const handleFullscreen = () => {
    if (!cardRef.current) return;
    
    if (!document.fullscreenElement) {
      cardRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !sessionData?.laps) return;

    // Destroy existing chart
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Dynamically import Chart.js
    import('chart.js/auto').then((ChartModule) => {
      const Chart = ChartModule.default;

    // Process lap data for chart
    const drivers = Array.from(new Set(sessionData.laps.map(lap => lap.driver)));
    const colors = [
      'hsl(190, 100%, 50%)', // Primary cyan
      'hsl(351, 100%, 56%)', // Secondary red  
      'hsl(42, 100%, 50%)', // Yellow
      'hsl(147, 78%, 42%)', // Green
      'hsl(341, 75%, 51%)', // Pink
      'hsl(255, 100%, 50%)', // Purple
      'hsl(30, 100%, 50%)', // Orange
      'hsl(120, 100%, 50%)', // Lime
    ];

    const datasets = drivers.map((driver, index) => {
      const driverLaps = sessionData.laps
        .filter(lap => lap.driver === driver && lap.lapTime > 0)
        .sort((a, b) => a.lapNumber - b.lapNumber);

      return {
        label: driver,
        data: driverLaps.map(lap => ({
          x: lap.lapNumber,
          y: lap.lapTime,
          driver: lap.driver,
          lap: lap.lapNumber
        })),
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '20',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.1,
      };
    });

    const maxLap = Math.max(...sessionData.laps.map(lap => lap.lapNumber));
    
      const newChart = new Chart(ctx, {
        type: 'line',
        data: {
          datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              backgroundColor: 'rgba(18, 18, 20, 0.9)',
              titleColor: '#FAFAFA',
              bodyColor: '#FAFAFA',
              borderColor: 'hsl(190, 100%, 50%)',
              borderWidth: 1,
              callbacks: {
                label: function(context: any) {
                  const time = context.parsed.y.toFixed(3);
                  return `${context.dataset.label}: ${time}s`;
                }
              }
            }
          },
          layout: {
            padding: {
              bottom: 20
            }
          },
          scales: {
            x: {
              type: 'linear',
              position: 'bottom',
              min: 1,
              max: maxLap,
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              ticks: {
                color: '#A0A0A0',
                stepSize: 5
              },
              title: {
                display: true,
                text: 'Lap Number',
                color: '#A0A0A0'
              }
            },
            y: {
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              ticks: {
                color: '#A0A0A0',
                callback: function(value: any) {
                  return value.toFixed(3) + 's';
                }
              },
              title: {
                display: true,
                text: 'Lap Time (seconds)',
                color: '#A0A0A0'
              }
            }
          },
          onClick: (event: any, elements: any[]) => {
            if (elements.length > 0) {
              const element = elements[0];
              const dataPoint = newChart.data.datasets[element.datasetIndex].data[element.index] as any;
              onLapSelect(dataPoint.driver, dataPoint.lap);
            }
          },
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
          }
        }
      });

      chartInstanceRef.current = newChart;

      // Add watermark
      const watermarkPlugin = {
        id: 'watermark',
        afterDraw: (chart: any) => {
          const ctx = chart.ctx;
          ctx.save();
          ctx.globalAlpha = 0.15;
          ctx.fillStyle = '#00d9ff';
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText('CEBRIC F1', chart.width / 2, chart.height - 5);
          ctx.restore();
        }
      };
      
      newChart.options.plugins = newChart.options.plugins || [];
      Chart.register(watermarkPlugin);
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [sessionData, onLapSelect]);

  const hasData = sessionData?.laps && sessionData.laps.length > 0;
  const drivers = hasData ? Array.from(new Set(sessionData.laps.map(lap => lap.driver))) : [];

  return (
    <Card ref={cardRef} className="mb-8 overflow-hidden" data-testid="lap-chart-section">
      <div className="p-6 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center" data-testid="title-lap-chart">
              <i className="fas fa-chart-area text-primary mr-2"></i>
              LAP CHART
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Lap time progression and comparison</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-primary" 
              onClick={handleExport}
              disabled={!hasData}
              title="Export Chart"
              data-testid="button-export"
            >
              <i className="fas fa-download"></i>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-primary" 
              onClick={handleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              data-testid="button-fullscreen"
            >
              <i className={isFullscreen ? "fas fa-compress" : "fas fa-expand"}></i>
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="chart-container flex items-center justify-center" data-testid="chart-container">
          {!hasData ? (
            <div className="text-center">
              <div className="inline-block mb-4">
                <i className="fas fa-flag-checkered text-6xl text-muted pulse-glow"></i>
              </div>
              <p className="text-muted-foreground text-lg" data-testid="text-waiting">
                Waiting for your selections...
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                Select filters above and click "Load Data" to view lap chart
              </p>
            </div>
          ) : (
            <canvas 
              ref={canvasRef} 
              className="w-full h-full" 
              data-testid="canvas-lap-chart"
            />
          )}
        </div>

        {/* Chart Legend */}
        {hasData && (
          <div className="mt-6" data-testid="chart-legend">
            <div className="flex flex-wrap gap-4 justify-center">
              {drivers.map((driver, index) => {
                const colors = [
                  'hsl(190, 100%, 50%)', 'hsl(351, 100%, 56%)', 'hsl(42, 100%, 50%)',
                  'hsl(147, 78%, 42%)', 'hsl(341, 75%, 51%)', 'hsl(255, 100%, 50%)',
                  'hsl(30, 100%, 50%)', 'hsl(120, 100%, 50%)'
                ];
                return (
                  <div key={driver} className="flex items-center space-x-2" data-testid={`legend-${driver}`}>
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: colors[index % colors.length] }}
                    ></div>
                    <span className="text-sm text-foreground font-mono">{driver}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

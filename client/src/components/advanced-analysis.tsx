
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { F1SessionResponse } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface AdvancedAnalysisProps {
  sessionData: F1SessionResponse | null;
  filters: { year: string; gp: string; session: string; drivers: string[] };
}

export default function AdvancedAnalysis({ sessionData, filters }: AdvancedAnalysisProps) {
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [selectedLap, setSelectedLap] = useState<string>("");
  const [analysisType, setAnalysisType] = useState<'downforce' | 'corners' | 'brake' | 'tire' | 'energy'>('downforce');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'race' | 'lap'>('race');
  const { toast } = useToast();

  const loadAnalysisMutation = useMutation({
    mutationFn: async (params: { type: string; year: number; gp: string; session: string; driver: string; lap: number }) => {
      const endpoint = params.type === 'downforce' ? '/api/f1/downforce-analysis' :
                       params.type === 'corners' ? '/api/f1/corner-analysis' :
                       params.type === 'tire' ? '/api/f1/tire-analysis' :
                       params.type === 'energy' ? '/api/f1/energy-analysis' :
                       '/api/f1/brake-analysis';
      const response = await apiRequest("POST", endpoint, params);
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisData(data);
      toast({
        title: "Analysis Loaded",
        description: "Advanced analysis data loaded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Loading Analysis",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLoadAnalysis = () => {
    if (!filters.year || !filters.gp || !filters.session || !selectedDriver || !selectedLap) {
      toast({
        title: "Missing Parameters",
        description: "Please select driver and lap for analysis",
        variant: "destructive",
      });
      return;
    }

    loadAnalysisMutation.mutate({
      type: analysisType,
      year: parseInt(filters.year),
      gp: filters.gp,
      session: filters.session,
      driver: selectedDriver,
      lap: parseInt(selectedLap),
    });
  };

  const availableDrivers = sessionData?.drivers || [];
  const maxLap = sessionData?.statistics.totalLaps || 50;
  const lapOptions = Array.from({ length: maxLap }, (_, i) => i + 1);

  // Calculate race average statistics
  const raceAverages = sessionData?.laps ? {
    avgSpeed: sessionData.laps.reduce((sum, lap) => sum + (lap.lapTime > 0 ? 1 : 0), 0) > 0 
      ? sessionData.statistics.avgLapTime : 0,
    topSpeed: sessionData.statistics.topSpeed.value,
    totalLaps: sessionData.statistics.totalLaps,
    fastestLap: sessionData.statistics.fastestLap.time,
  } : null;

  return (
    <Card className="mt-6" data-testid="advanced-analysis">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <i className="fas fa-chart-area text-primary mr-2"></i>
            Advanced Analysis
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'race' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('race')}
            >
              Race Averages
            </Button>
            <Button
              variant={viewMode === 'lap' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('lap')}
            >
              Lap Analysis
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          {viewMode === 'race' ? 'Overall race statistics and averages' : 'Detailed lap-by-lap analysis'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {viewMode === 'race' ? (
          // Race Averages Section
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Average Lap Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {sessionData?.statistics.avgLapTime 
                      ? `${sessionData.statistics.avgLapTime.toFixed(3)}s`
                      : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">All drivers average</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Lap Time Variance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">
                    {sessionData?.laps 
                      ? `${(sessionData.laps.filter(l => l.lapTime > 0).reduce((sum, l) => sum + Math.pow(l.lapTime - sessionData.statistics.avgLapTime, 2), 0) / sessionData.laps.filter(l => l.lapTime > 0).length).toFixed(3)}s²`
                      : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Consistency metric</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Active Drivers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">
                    {sessionData?.drivers.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">In session</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Distance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {sessionData?.laps && sessionData.laps.length > 0
                      ? `${((sessionData.statistics.totalLaps || 0) * 5).toFixed(0)} km`
                      : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Approx. track length × laps</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Fastest Lap</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {sessionData?.statistics.fastestLap.time 
                      ? `${sessionData.statistics.fastestLap.time.toFixed(3)}s`
                      : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {sessionData?.statistics.fastestLap.driver || 'No data'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Top Speed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">
                    {sessionData?.statistics.topSpeed.value 
                      ? `${sessionData.statistics.topSpeed.value.toFixed(1)} km/h`
                      : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {sessionData?.statistics.topSpeed.driver || 'No data'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Average Speed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">
                    {sessionData?.laps && sessionData.laps.length > 0
                      ? `${(sessionData.laps.filter(l => l.lapTime > 0).reduce((sum, l) => {
                          const trackLength = 5000;
                          const speed = trackLength / l.lapTime * 3.6;
                          return sum + speed;
                        }, 0) / sessionData.laps.filter(l => l.lapTime > 0).length).toFixed(1)} km/h`
                      : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Overall session average</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Session Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {sessionData?.laps && sessionData.laps.length > 0
                      ? `${Math.floor(sessionData.laps.filter(l => l.lapTime > 0).reduce((sum, l) => sum + l.lapTime, 0) / 60)} min`
                      : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Total race time</p>
                </CardContent>
              </Card>
            </div>

            {sessionData?.laps && (
              <Card>
                <CardHeader>
                  <CardTitle>Lap Time Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sessionData.drivers.map(driver => {
                      const driverLaps = sessionData.laps.filter(l => l.driver === driver && l.lapTime > 0);
                      return {
                        driver,
                        avgLap: driverLaps.length > 0 
                          ? driverLaps.reduce((sum, l) => sum + l.lapTime, 0) / driverLaps.length 
                          : 0,
                        bestLap: driverLaps.length > 0 
                          ? Math.min(...driverLaps.map(l => l.lapTime)) 
                          : 0,
                      };
                    })}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="driver" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${Number(value).toFixed(3)}s`} />
                      <Legend />
                      <Bar dataKey="bestLap" fill="#00d9ff" name="Best Lap" />
                      <Bar dataKey="avgLap" fill="#ff3853" name="Avg Lap" />
                      <text x="50%" y="95%" textAnchor="middle" fill="#00d9ff" opacity="0.15" fontSize="20" fontWeight="bold">CEBRIC F1</text>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          // Lap-by-Lap Analysis Section
          <div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Analysis Type</label>
                <Select value={analysisType} onValueChange={(value: any) => setAnalysisType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="downforce">Downforce</SelectItem>
                    <SelectItem value="corners">Corner Analysis</SelectItem>
                    <SelectItem value="brake">Brake Analysis</SelectItem>
                    <SelectItem value="tire">Tire Degradation</SelectItem>
                    <SelectItem value="energy">Energy Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Driver</label>
                <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDrivers.map((driver) => (
                      <SelectItem key={driver} value={driver}>{driver}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Lap</label>
                <div className="flex gap-2">
                  <Select value={selectedLap} onValueChange={setSelectedLap}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select lap..." />
                    </SelectTrigger>
                    <SelectContent>
                      {lapOptions.map((lap) => (
                        <SelectItem key={lap} value={lap.toString()}>{lap}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {sessionData?.statistics.fastestLap && selectedDriver && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const validLaps = sessionData.laps.filter(lap => lap.driver === selectedDriver && lap.lapTime > 0);
                        if (validLaps.length === 0) {
                          toast({
                            title: "No valid laps",
                            description: "No completed laps found for this driver",
                            variant: "destructive",
                          });
                          return;
                        }
                        const minTime = Math.min(...validLaps.map(lap => lap.lapTime));
                        const fastestLapData = validLaps.find(l => l.lapTime === minTime);
                        if (fastestLapData) {
                          setSelectedLap(fastestLapData.lapNumber.toString());
                        }
                      }}
                      title="Select fastest lap for this driver"
                      data-testid="button-fastest-lap-analysis"
                    >
                      <i className="fas fa-bolt text-yellow-500"></i>
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-end md:col-span-2">
                <Button onClick={handleLoadAnalysis} disabled={loadAnalysisMutation.isPending} className="w-full">
                  {loadAnalysisMutation.isPending ? <i className="fas fa-spinner loading-spinner"></i> : "Load Analysis"}
                </Button>
              </div>
            </div>

            {!analysisData ? (
              <div className="text-center py-12">
                <i className="fas fa-chart-line text-6xl text-muted mb-4"></i>
                <p className="text-muted-foreground">Select analysis type and parameters to view detailed insights</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Downforce Analysis */}
                {analysisType === 'downforce' && analysisData.downforceIndex !== undefined && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Downforce Index</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-primary">{analysisData.downforceIndex.toFixed(1)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Relative downforce level (0-100)</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">High Speed Avg</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-secondary">{analysisData.highSpeedAvg.toFixed(1)} km/h</div>
                        <p className="text-xs text-muted-foreground mt-1">Average in high-speed sections</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Aero Efficiency</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-accent">{analysisData.aerodynamicEfficiency.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Speed/variance ratio</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Corner Analysis */}
                {analysisType === 'corners' && analysisData.corners && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Corner Performance Breakdown ({analysisData.corners.length} corners detected)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analysisData.corners.map((corner: any) => (
                          <div key={corner.cornerNumber} className="p-4 bg-muted/30 rounded-lg border border-border">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold flex items-center gap-2">
                                Corner {corner.cornerNumber}
                                <span className={`text-xs px-2 py-1 rounded ${
                                  corner.type === 'slow' ? 'bg-red-500/20 text-red-400' :
                                  corner.type === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-green-500/20 text-green-400'
                                }`}>
                                  {corner.type.toUpperCase()}
                                </span>
                              </h4>
                              <span className="text-sm text-muted-foreground">Δ {corner.speedDelta.toFixed(1)} km/h</span>
                            </div>
                            <div className="grid grid-cols-5 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Brake Point</p>
                                <p className="font-mono text-lg">{corner.brakePoint.speed.toFixed(1)} km/h</p>
                                <p className="text-xs text-muted-foreground">@ {corner.brakePoint.distance.toFixed(0)}m</p>
                                <p className="text-xs text-red-400">Brake: {corner.brakePoint.brakeForce.toFixed(0)}%</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Apex Speed</p>
                                <p className="font-mono text-lg text-primary">{corner.apex.minSpeed.toFixed(1)} km/h</p>
                                <p className="text-xs text-muted-foreground">@ {corner.apex.distance.toFixed(0)}m</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Exit Speed</p>
                                <p className="font-mono text-lg text-secondary">{corner.exit.speed.toFixed(1)} km/h</p>
                                <p className="text-xs text-muted-foreground">@ {corner.exit.distance.toFixed(0)}m</p>
                                <p className="text-xs text-green-400">Throttle: {corner.exit.throttle.toFixed(0)}%</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Time in Corner</p>
                                <p className="font-mono text-lg text-accent">{corner.timeInCorner ? corner.timeInCorner.toFixed(3) : ((corner.exit.distance - corner.brakePoint.distance) / ((corner.apex.minSpeed + corner.exit.speed) / 2 / 3.6)).toFixed(3)}s</p>
                                <p className="text-xs text-muted-foreground">Entry to Exit</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">G-Force</p>
                                <p className="font-mono text-lg text-orange-400">{corner.gForce ? corner.gForce.toFixed(2) : (((corner.apex.minSpeed / 3.6) ** 2 / (50 + corner.cornerNumber * 5)) / 9.81).toFixed(2)}G</p>
                                <p className="text-xs text-muted-foreground">Peak lateral</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Tire Degradation Analysis */}
                {analysisType === 'tire' && analysisData && analysisData.compound && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="border-l-4 border-l-primary">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <i className="fas fa-tire text-primary"></i>
                            Tire Compound
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className={`text-3xl font-bold ${
                            analysisData.compound === 'SOFT' ? 'text-red-500' :
                            analysisData.compound === 'MEDIUM' ? 'text-yellow-500' :
                            analysisData.compound === 'HARD' ? 'text-gray-300' :
                            'text-primary'
                          }`}>
                            {analysisData.compound || 'N/A'}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Current compound</p>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-secondary">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <i className="fas fa-clock text-secondary"></i>
                            Tire Age
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-secondary">{analysisData.tireAge || 0} laps</div>
                          <p className="text-xs text-muted-foreground mt-1">Laps on this set</p>
                          <div className="mt-2 w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-secondary h-2 rounded-full transition-all"
                              style={{ width: `${Math.min((analysisData.tireAge / 30) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-accent">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <i className="fas fa-chart-line text-accent"></i>
                            Degradation Rate
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-accent">
                            {(analysisData.degradationRate || 0) > 0 ? '+' : ''}{(analysisData.degradationRate || 0).toFixed(3)}s/lap
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Time loss per lap</p>
                          <p className="text-xs text-accent-foreground mt-1">
                            {Math.abs(analysisData.degradationRate || 0) < 0.05 ? 'Minimal degradation' :
                             Math.abs(analysisData.degradationRate || 0) < 0.15 ? 'Moderate degradation' :
                             'High degradation'}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className={`border-l-4 ${
                        analysisData.performance === 'optimal' ? 'border-l-green-500' :
                        analysisData.performance === 'degraded' ? 'border-l-yellow-500' :
                        'border-l-red-500'
                      }`}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <i className={`fas fa-circle ${
                              analysisData.performance === 'optimal' ? 'text-green-500' :
                              analysisData.performance === 'degraded' ? 'text-yellow-500' :
                              'text-red-500'
                            }`}></i>
                            Performance Status
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className={`text-2xl font-bold ${
                            analysisData.performance === 'optimal' ? 'text-green-500' :
                            analysisData.performance === 'degraded' ? 'text-yellow-500' :
                            'text-red-500'
                          }`}>
                            {(analysisData.performance || 'UNKNOWN').toUpperCase()}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Tire condition</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <i className="fas fa-tachometer-alt"></i>
                            Average Speed
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{(analysisData.avgSpeed || 0).toFixed(1)} km/h</div>
                          <p className="text-xs text-muted-foreground mt-1">On this lap</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <i className="fas fa-hourglass-half text-primary"></i>
                            Est. Life Remaining
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-primary">{analysisData.estimatedLifeRemaining || 0} laps</div>
                          <p className="text-xs text-muted-foreground mt-1">Before critical wear</p>
                          <div className="mt-2 flex items-center gap-1 text-xs">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div 
                                key={i} 
                                className={`h-2 flex-1 rounded ${
                                  i < Math.ceil((analysisData.estimatedLifeRemaining / 10) * 5) 
                                    ? 'bg-primary' 
                                    : 'bg-muted'
                                }`}
                              ></div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <i className="fas fa-temperature-high text-orange-500"></i>
                            Temperature Impact
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-orange-500">{(analysisData.tempImpact || 0).toFixed(1)}%</div>
                          <p className="text-xs text-muted-foreground mt-1">Temp degradation factor</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <i className="fas fa-exclamation-triangle text-yellow-500"></i>
                            Wear Level
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-yellow-500">{(analysisData.wearLevel || 0).toFixed(1)}%</div>
                          <p className="text-xs text-muted-foreground mt-1">Current tire wear</p>
                          <div className="mt-2 w-full bg-muted rounded-full h-2.5 overflow-hidden">
                            <div 
                              className={`h-2.5 rounded-full transition-all ${
                                (analysisData.wearLevel || 0) < 30 ? 'bg-green-500' :
                                (analysisData.wearLevel || 0) < 60 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(analysisData.wearLevel || 0, 100)}%` }}
                            ></div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Tire Wear Progression Chart */}
                    <Card className="bg-gradient-to-br from-red-500/5 via-yellow-500/5 to-gray-500/5">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <i className="fas fa-chart-area text-primary"></i>
                          Tire Wear Progression
                        </CardTitle>
                        <CardDescription>Estimated wear development over tire life</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={(() => {
                            const maxLife = 40;
                            const currentAge = analysisData.tireAge || 0;
                            const degradationRate = analysisData.degradationRate || 0;
                            return Array.from({ length: maxLife + 1 }, (_, i) => ({
                              lap: i,
                              wear: Math.min(100, (i / maxLife) * 100 + (degradationRate * i * 50)),
                              performance: Math.max(0, 100 - ((i / maxLife) * 100 + (degradationRate * i * 50))),
                              current: i === currentAge
                            }));
                          })()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="lap" label={{ value: 'Lap on Tire', position: 'insideBottom', offset: -5 }} />
                            <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                            <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                            <Legend />
                            <Line type="monotone" dataKey="wear" stroke="#ef4444" strokeWidth={2} name="Tire Wear" dot={false} />
                            <Line type="monotone" dataKey="performance" stroke="#22c55e" strokeWidth={2} name="Performance" dot={false} />
                            <ReferenceLine x={analysisData.tireAge} stroke="#00d9ff" strokeDasharray="3 3" label="Current" />
                            <text x="50%" y="95%" textAnchor="middle" fill="#00d9ff" opacity="0.15" fontSize="20" fontWeight="bold">CEBRIC F1</text>
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <i className="fas fa-info-circle text-primary"></i>
                          Tire Performance Analysis
                        </CardTitle>
                        <CardDescription>Detailed tire degradation metrics and insights</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg hover:bg-background/70 transition-colors">
                            <span className="text-sm font-medium flex items-center gap-2">
                              <i className="fas fa-circle text-primary"></i>
                              Compound Type:
                            </span>
                            <span className={`text-lg font-bold px-3 py-1 rounded ${
                              analysisData.compound === 'SOFT' ? 'bg-red-500/20 text-red-400' :
                              analysisData.compound === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                              analysisData.compound === 'HARD' ? 'bg-gray-500/20 text-gray-300' :
                              'bg-primary/20 text-primary'
                            }`}>
                              {analysisData.compound}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg hover:bg-background/70 transition-colors">
                            <span className="text-sm font-medium flex items-center gap-2">
                              <i className="fas fa-layer-group"></i>
                              Current Lap on Tires:
                            </span>
                            <span className="text-lg font-bold">{analysisData.tireAge} / ~{analysisData.tireAge + (analysisData.estimatedLifeRemaining || 0)}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg hover:bg-background/70 transition-colors">
                            <span className="text-sm font-medium flex items-center gap-2">
                              <i className="fas fa-chart-line"></i>
                              Degradation per Lap:
                            </span>
                            <span className="text-lg font-bold text-secondary">
                              {analysisData.degradationRate > 0 ? '+' : ''}{analysisData.degradationRate.toFixed(3)}s
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg hover:bg-background/70 transition-colors">
                            <span className="text-sm font-medium flex items-center gap-2">
                              <i className="fas fa-battery-three-quarters"></i>
                              Performance Level:
                            </span>
                            <span className={`text-lg font-bold px-3 py-1 rounded ${
                              analysisData.performance === 'optimal' ? 'bg-green-500/20 text-green-400' :
                              analysisData.performance === 'degraded' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {analysisData.performance.charAt(0).toUpperCase() + analysisData.performance.slice(1)}
                            </span>
                          </div>
                          
                          <div className="mt-4 p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <i className="fas fa-lightbulb text-yellow-400"></i>
                              Tire Strategy Insights
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-start gap-2">
                                <i className="fas fa-check-circle text-green-400 mt-0.5"></i>
                                <div>
                                  <span className="font-medium">Estimated Life:</span> 
                                  <span className="ml-2">{analysisData.estimatedLifeRemaining || 0} more laps before critical wear</span>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <i className={`fas fa-${
                                  (analysisData.wearLevel || 0) < 30 ? 'check-circle text-green-400' :
                                  (analysisData.wearLevel || 0) < 60 ? 'exclamation-circle text-yellow-400' :
                                  'times-circle text-red-400'
                                } mt-0.5`}></i>
                                <div>
                                  <span className="font-medium">Current Wear:</span> 
                                  <span className="ml-2">{(analysisData.wearLevel || 0).toFixed(1)}% - {
                                    (analysisData.wearLevel || 0) < 30 ? 'Tires in good condition' :
                                    (analysisData.wearLevel || 0) < 60 ? 'Moderate wear detected' :
                                    'High wear - consider pit stop'
                                  }</span>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <i className="fas fa-temperature-high text-orange-400 mt-0.5"></i>
                                <div>
                                  <span className="font-medium">Temperature Effect:</span> 
                                  <span className="ml-2">{(analysisData.tempImpact || 0).toFixed(1)}% degradation from heat</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Energy Management Analysis */}
                {analysisType === 'energy' && analysisData && analysisData.fullThrottlePct !== undefined && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Full Throttle</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-primary">{(analysisData.fullThrottlePct || 0).toFixed(1)}%</div>
                          <p className="text-xs text-muted-foreground mt-1">Of lap duration</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Lift & Coast</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-secondary">{(analysisData.liftAndCoastPct || 0).toFixed(1)}%</div>
                          <p className="text-xs text-muted-foreground mt-1">Energy saving</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">ERS Deployment</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className={`text-2xl font-bold ${
                            analysisData.ersDeployment === 'high' ? 'text-green-500' :
                            analysisData.ersDeployment === 'medium' ? 'text-yellow-500' :
                            'text-red-500'
                          }`}>
                            {(analysisData.ersDeployment || 'UNKNOWN').toUpperCase()}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Usage level</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Efficiency Score</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-accent">{(analysisData.efficiencyScore || 0).toFixed(1)}</div>
                          <p className="text-xs text-muted-foreground mt-1">Out of 100</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Estimated Brake Energy</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-orange-500">{(analysisData.estimatedBrakeEnergy || 0).toFixed(2)} MJ</div>
                          <p className="text-xs text-muted-foreground mt-1">Total brake energy</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Energy Recovery</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-500">{(analysisData.estimatedEnergyRecovery || 0).toFixed(2)} MJ</div>
                          <p className="text-xs text-muted-foreground mt-1">ERS recovery</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Power Unit Stress</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-purple-500">{(analysisData.puStress || 0).toFixed(1)}%</div>
                          <p className="text-xs text-muted-foreground mt-1">Component stress level</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Fuel Efficiency</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-blue-500">{(analysisData.fuelEfficiency || 0).toFixed(2)} kg/lap</div>
                          <p className="text-xs text-muted-foreground mt-1">Estimated consumption</p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="bg-gradient-to-r from-green-500/5 to-blue-500/5 border-green-500/20">
                      <CardHeader>
                        <CardTitle>Energy Management Strategy</CardTitle>
                        <CardDescription>Detailed power unit performance analysis</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                            <span className="text-sm font-medium">Full Throttle Usage:</span>
                            <span className="text-lg font-bold text-primary">{analysisData.fullThrottlePct.toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                            <span className="text-sm font-medium">Lift & Coast Percentage:</span>
                            <span className="text-lg font-bold text-secondary">{analysisData.liftAndCoastPct.toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                            <span className="text-sm font-medium">ERS Deployment Mode:</span>
                            <span className={`text-lg font-bold ${
                              analysisData.ersDeployment === 'high' ? 'text-green-500' :
                              analysisData.ersDeployment === 'medium' ? 'text-yellow-500' :
                              'text-red-500'
                            }`}>
                              {analysisData.ersDeployment.charAt(0).toUpperCase() + analysisData.ersDeployment.slice(1)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                            <span className="text-sm font-medium">Overall Efficiency:</span>
                            <span className="text-lg font-bold text-accent">{analysisData.efficiencyScore.toFixed(1)}/100</span>
                          </div>
                          <div className="mt-4 p-4 bg-gradient-to-r from-orange-500/10 to-green-500/10 rounded-lg border border-green-500/20">
                            <div className="grid grid-cols-2 gap-4 text-center">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Brake Energy</p>
                                <p className="text-xl font-bold text-orange-500">{analysisData.estimatedBrakeEnergy.toFixed(2)} MJ</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Recovery</p>
                                <p className="text-xl font-bold text-green-500">{analysisData.estimatedEnergyRecovery.toFixed(2)} MJ</p>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-border/30">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Recovery Efficiency:</span>
                                <span className="font-semibold text-green-400">
                                  {((analysisData.estimatedEnergyRecovery / analysisData.estimatedBrakeEnergy) * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Energy Usage Visualization */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Throttle Distribution</CardTitle>
                        <CardDescription>Breakdown of throttle application during lap</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={(() => {
                            const fullThrottle = analysisData.fullThrottlePct || 0;
                            const liftCoast = analysisData.liftAndCoastPct || 0;
                            const partialThrottle = Math.max(0, 100 - fullThrottle - liftCoast);
                            return [
                              { name: 'Full Throttle (>95%)', value: fullThrottle, fill: '#22c55e' },
                              { name: 'Partial Throttle', value: partialThrottle, fill: '#3b82f6' },
                              { name: 'Lift & Coast (<20%)', value: liftCoast, fill: '#f59e0b' },
                            ];
                          })()} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                            <YAxis type="category" dataKey="name" width={130} />
                            <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Time %']} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                            <text x="50%" y="95%" textAnchor="middle" fill="#00d9ff" opacity="0.15" fontSize="18" fontWeight="bold">CEBRIC F1</text>
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Brake Analysis - Enhanced */}
                {analysisType === 'brake' && analysisData && analysisData.brakeZones && Array.isArray(analysisData.brakeZones) && analysisData.brakeZones.length > 0 && (
                  <div className="space-y-6">
                    {/* Main Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Total Brake Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{(analysisData.totalBrakeTimePercent || 0).toFixed(1)}%</div>
                          <p className="text-xs text-muted-foreground mt-1">Of lap duration</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Avg Brake Force</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{(analysisData.avgBrakeForce || 0).toFixed(1)}%</div>
                          <p className="text-xs text-muted-foreground mt-1">When braking</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Brake Zones</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-primary">{analysisData.brakeZones.length}</div>
                          <p className="text-xs text-muted-foreground mt-1">Detected zones</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Max Speed Loss</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-secondary">
                            {Math.max(...analysisData.brakeZones.map((z: any) => z.speedLoss || 0)).toFixed(1)} km/h
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Hardest braking zone</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Additional Brake Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Peak Brake Pressure</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-red-500">
                            {Math.max(...analysisData.brakeZones.map((z: any) => z.peakBrakeForce || 0)).toFixed(0)}%
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Maximum recorded</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Brake Efficiency</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-primary">
                            {analysisData.avgBrakeForce > 0 
                              ? ((analysisData.brakeZones.reduce((sum: number, z: any) => sum + (z.speedLoss || 0), 0) / analysisData.brakeZones.length / analysisData.avgBrakeForce) * 100).toFixed(1)
                              : '0.0'}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Speed loss per brake %</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Avg Brake Duration</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-accent">
                            {(analysisData.brakeZones.reduce((sum: number, z: any) => sum + (z.duration || 0), 0) / analysisData.brakeZones.length).toFixed(2)}s
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Per brake zone</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Total Brake Distance</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-orange-500">
                            {analysisData.brakeZones.reduce((sum: number, z: any) => sum + ((z.endDistance || 0) - (z.startDistance || 0)), 0).toFixed(0)}m
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Combined brake zones</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Detailed Brake Zones List */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Detailed Brake Zone Analysis</CardTitle>
                        <CardDescription>In-depth metrics for each detected braking zone</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {analysisData.brakeZones.map((zone: any, idx: number) => (
                            <div key={idx} className="p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-lg border border-red-500/20">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-lg flex items-center gap-2">
                                  <span className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm">
                                    {idx + 1}
                                  </span>
                                  Brake Zone {idx + 1}
                                </h4>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Speed Loss</p>
                                    <p className="text-lg font-bold text-red-400">{zone.speedLoss.toFixed(1)} km/h</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Peak Brake</p>
                                    <p className="text-lg font-bold text-orange-400">{zone.peakBrakeForce.toFixed(0)}%</p>
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Start Distance</p>
                                  <p className="font-mono text-base font-semibold">{zone.startDistance.toFixed(0)} m</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">End Distance</p>
                                  <p className="font-mono text-base font-semibold">{zone.endDistance.toFixed(0)} m</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Avg Brake Force</p>
                                  <p className="font-mono text-base font-semibold">{zone.avgBrakeForce.toFixed(1)}%</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Duration</p>
                                  <p className="font-mono text-base font-semibold">{zone.duration.toFixed(2)} s</p>
                                </div>
                              </div>
                              <div className="mt-3 pt-3 border-t border-border/30">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Brake Efficiency Index:</span>
                                  <span className="font-semibold text-primary">
                                    {((zone.speedLoss / zone.peakBrakeForce) * 10).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

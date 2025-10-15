import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { F1SessionResponse } from "@shared/schema";

interface FilterPanelProps {
  onDataLoaded: (data: F1SessionResponse) => void;
  onFiltersChange: (filters: { year: string; gp: string; session: string; drivers: string[] }) => void;
  filters: { year: string; gp: string; session: string; drivers: string[] };
}

export default function FilterPanel({ onDataLoaded, onFiltersChange, filters }: FilterPanelProps) {
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<string[]>([]);
  const { toast } = useToast();

  // Get available years
  const { data: years } = useQuery<number[]>({
    queryKey: ["/api/f1/years"],
  });

  // Get available GPs for selected year
  const { data: gps } = useQuery<any[]>({
    queryKey: ["/api/f1/gps", filters.year],
    enabled: !!filters.year,
  });

  // Get available sessions
  const { data: sessions } = useQuery<any[]>({
    queryKey: ["/api/f1/sessions"],
  });

  // Load session data mutation
  const loadDataMutation = useMutation({
    mutationFn: async (params: { year: number; gp: string; session: string; drivers?: string[] }) => {
      const response = await apiRequest("POST", "/api/f1/session", params);
      return response.json();
    },
    onSuccess: (data: F1SessionResponse) => {
      console.log("Session data loaded:", data);
      console.log("Available drivers:", data.drivers);
      onDataLoaded(data);
      setAvailableDrivers(data.drivers);
      toast({
        title: "Data Loaded Successfully",
        description: `Loaded ${data.laps.length} laps from ${data.drivers.length} drivers`,
      });
    },
    onError: (error: Error) => {
      console.error("Error loading session:", error);
      toast({
        title: "Error Loading Data",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleYearChange = (year: string) => {
    onFiltersChange({ ...filters, year, gp: "", session: "", drivers: [] });
    setSelectedDrivers([]);
    setAvailableDrivers([]);
  };

  const handleGPChange = (gp: string) => {
    onFiltersChange({ ...filters, gp, session: "", drivers: [] });
    setSelectedDrivers([]);
    setAvailableDrivers([]);
  };

  const handleSessionChange = (session: string) => {
    onFiltersChange({ ...filters, session, drivers: [] });
    setSelectedDrivers([]);
    setAvailableDrivers([]);
  };

  const handleDriversChange = (drivers: string[]) => {
    setSelectedDrivers(drivers);
    onFiltersChange({ ...filters, drivers });
  };

  const handleLoadData = () => {
    if (!filters.year || !filters.gp || !filters.session) {
      toast({
        title: "Missing Filters",
        description: "Please select Year, GP, and Session before loading data",
        variant: "destructive",
      });
      return;
    }

    // If reloading with a driver filter, pass it along
    // Otherwise, clear driver selection and load all drivers
    const driversToLoad = selectedDrivers.length > 0 ? selectedDrivers : undefined;
    
    loadDataMutation.mutate({
      year: parseInt(filters.year),
      gp: filters.gp,
      session: filters.session,
      drivers: driversToLoad,
    });
  };

  const handleReset = () => {
    onFiltersChange({ year: "", gp: "", session: "", drivers: [] });
    setSelectedDrivers([]);
    setAvailableDrivers([]);
    onDataLoaded({} as F1SessionResponse);
  };

  return (
    <Card className="mb-8 sticky top-4 z-50 shadow-lg" data-testid="filter-panel">
      <CardContent className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground flex items-center" data-testid="title-filters">
            <i className="fas fa-filter text-primary mr-2"></i>
            Session Filters
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Year Dropdown */}
          <div data-testid="filter-year">
            <label className="block text-sm font-medium text-muted-foreground mb-2">Year</label>
            <Select value={filters.year} onValueChange={handleYearChange}>
              <SelectTrigger className="w-full bg-muted border-border">
                <SelectValue placeholder="Select Year..." />
              </SelectTrigger>
              <SelectContent>
                {years?.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Grand Prix Dropdown */}
          <div data-testid="filter-gp">
            <label className="block text-sm font-medium text-muted-foreground mb-2">Grand Prix</label>
            <Select value={filters.gp} onValueChange={handleGPChange} disabled={!filters.year}>
              <SelectTrigger className="w-full bg-muted border-border">
                <SelectValue placeholder="Select GP..." />
              </SelectTrigger>
              <SelectContent>
                {gps?.map((gp) => (
                  <SelectItem key={gp.name} value={gp.name}>
                    {gp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Session Dropdown */}
          <div data-testid="filter-session">
            <label className="block text-sm font-medium text-muted-foreground mb-2">Session</label>
            <Select value={filters.session} onValueChange={handleSessionChange} disabled={!filters.gp}>
              <SelectTrigger className="w-full bg-muted border-border">
                <SelectValue placeholder="Select Session..." />
              </SelectTrigger>
              <SelectContent>
                {sessions?.map((session) => (
                  <SelectItem key={session.key} value={session.key}>
                    {session.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Drivers Multi-Select */}
          <div data-testid="filter-drivers">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Filter by Driver
              {availableDrivers.length === 0 && (
                <span className="text-xs ml-1">(Load session first)</span>
              )}
            </label>
            <Select 
              value={selectedDrivers.length > 0 ? selectedDrivers[0] : "all"} 
              onValueChange={(value) => {
                if (value === "all") {
                  handleDriversChange([]);
                } else {
                  handleDriversChange([value]);
                }
              }}
              disabled={availableDrivers.length === 0}
            >
              <SelectTrigger className="w-full bg-muted border-border">
                <SelectValue placeholder={availableDrivers.length === 0 ? "Load session first" : "All Drivers"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drivers</SelectItem>
                {availableDrivers.map((driver) => (
                  <SelectItem key={driver} value={driver}>
                    {driver}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <i className="fas fa-info-circle mr-1"></i>
            {availableDrivers.length > 0 
              ? "Driver filter available - select to reload with specific driver" 
              : "Select Year, GP, and Session to load data"}
          </p>
          <Button 
            onClick={handleLoadData}
            disabled={loadDataMutation.isPending || !filters.year || !filters.gp || !filters.session}
            className="px-6 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="button-load-data"
          >
            {loadDataMutation.isPending ? (
              <>
                <i className="fas fa-spinner loading-spinner mr-2"></i>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <i className="fas fa-chart-line mr-2"></i>
                <span>{availableDrivers.length > 0 ? "Reload Data" : "Load Data"}</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

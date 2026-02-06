import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import Calendar from './components/Calendar';
import WorkLogForm from './components/WorkLogForm';
import {
  addDriver,
  addTrailer,
  addTruck,
  loadState,
  saveState,
  uid,
  upsertWorkLog,
} from './lib/storage';
import { AppState, WorkLog } from './types';

const todayISO = format(new Date(), 'yyyy-MM-dd');

function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  const [month, setMonth] = useState<Date>(new Date());
  const [theme, setTheme] = useState<string>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('theme') || 'dark' : 'dark',
  );

  // Make sure selected date always has a work log entry
  useEffect(() => {
    setState((prev) => {
      const existing = prev.workLogs.find((l) => l.date === selectedDate);
      if (existing) return prev;
      const blank: WorkLog = {
        id: uid(),
        date: selectedDate,
        jobs: [],
      };
      return upsertWorkLog(prev, blank);
    });
  }, [selectedDate]);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const currentLog = useMemo(
    () => state.workLogs.find((l) => l.date === selectedDate),
    [state.workLogs, selectedDate],
  );

  const handleLogChange = (log: WorkLog) => {
    setState((prev) => upsertWorkLog(prev, log));
  };

  const handleCreateDriver = (name: string) => {
    let newId = '';
    setState((prev) => {
      const [next, driver] = addDriver(prev, name);
      newId = driver.id;
      return next;
    });
    return newId;
  };

  const handleCreateTruck = (plate: string) => {
    let newId = '';
    setState((prev) => {
      const [next, truck] = addTruck(prev, plate);
      newId = truck.id;
      return next;
    });
    return newId;
  };

  const handleCreateTrailer = (plate: string) => {
    let newId = '';
    setState((prev) => {
      const [next, trailer] = addTrailer(prev, plate);
      newId = trailer.id;
      return next;
    });
    return newId;
  };

  const sortedJobs = currentLog?.jobs ?? [];

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <div className="eyebrow">Fuel tanker daily log</div>
          <div className="title">Keep every drop accounted for</div>
        </div>
        <div className="topbar__actions">
          <button
            className="ghost"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '🌞 Light' : '🌙 Dark'}
          </button>
        </div>
      </header>

      <main className="layout">
        <section className="sidebar">
          <Calendar
            month={month}
            selectedDate={selectedDate}
            logs={state.workLogs}
            onSelect={(iso) => {
              setSelectedDate(iso);
            }}
            onMonthChange={(date) => {
              setMonth(date);
              setSelectedDate(format(date, 'yyyy-MM-dd'));
            }}
          />

          <div className="timeline panel">
            <div className="panel__header">
              <div>
                <div className="eyebrow">Sequence</div>
                <div className="title">Jobs added</div>
              </div>
            </div>
            <div className="timeline__body">
              {sortedJobs.length === 0 && <div className="muted">No jobs yet for this day.</div>}
              {sortedJobs.map((job, idx) => (
                <div key={job.id} className="timeline__item">
                  <div className="bubble">{idx + 1}</div>
                  <div>
                    <div className="strong">{job.jobNumber || 'Job #' + (idx + 1)}</div>
                    <div className="muted small">
                      {job.customerAccount || 'Customer'} • {job.drops.length} drops
                    </div>
                    {job.drops.map((d, di) => (
                      <div key={d.id} className="muted tiny">
                        Drop {di + 1}: {d.customerName || job.customerAccount || 'Customer'} @{' '}
                        {d.deliveryAddress || 'Address'}
                        {d.cargos.map((c) => (
                          <div key={c.id}>
                            {c.cargoType.replace('_', ' ')} {c.liters.toLocaleString()} L • Comp {c.compartment}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="content">
          {currentLog ? (
            <WorkLogForm
              log={currentLog}
              drivers={state.drivers}
              trucks={state.trucks}
              trailers={state.trailers}
              onChange={handleLogChange}
              onCreateDriver={handleCreateDriver}
              onCreateTruck={handleCreateTruck}
              onCreateTrailer={handleCreateTrailer}
            />
          ) : (
            <div className="panel">Loading...</div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;

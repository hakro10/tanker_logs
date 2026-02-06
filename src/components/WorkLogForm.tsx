import { useMemo, useState } from 'react';
import { cargoOptions, Driver, Job, Trailer, Truck, WorkLog } from '../types';
import { combineDateAndTime, readableDuration } from '../lib/time';
import { uid } from '../lib/storage';

interface WorkLogFormProps {
  log: WorkLog;
  drivers: Driver[];
  trucks: Truck[];
  trailers: Trailer[];
  onChange: (log: WorkLog) => void;
  onCreateDriver: (name: string) => string;
  onCreateTruck: (plate: string) => string;
  onCreateTrailer: (plate: string) => string;
}

function Label({ text }: { text: string }) {
  return <label className="label">{text}</label>;
}

export function WorkLogForm({
  log,
  drivers,
  trucks,
  trailers,
  onChange,
  onCreateDriver,
  onCreateTruck,
  onCreateTrailer,
}: WorkLogFormProps) {
  const [newDriver, setNewDriver] = useState('');
  const [newTruck, setNewTruck] = useState('');
  const [newTrailer, setNewTrailer] = useState('');

  const start = combineDateAndTime(log.date, log.startTime);
  const end = combineDateAndTime(log.date, log.endTime);
  const duration = readableDuration(start, end);

  const trailer = trailers.find((t) => t.id === log.trailerId) || trailers[0];
  const compartmentCount = trailer?.compartmentCount ?? 6;

  const compartmentTotals = useMemo(() => {
    const totals = Array.from({ length: compartmentCount }, () => 0);
    log.jobs.forEach((job) => {
      job.drops.forEach((drop) => {
        drop.cargos.forEach((cargo) => {
          if (cargo.compartment - 1 in totals) {
            totals[cargo.compartment - 1] += cargo.liters;
          }
        });
      });
    });
    return totals;
  }, [log.jobs, compartmentCount]);

  const updateLog = (next: Partial<WorkLog>) => {
    onChange({ ...log, ...next });
  };

  const updateJob = (jobId: string, updater: (job: Job) => Job) => {
    const jobs = log.jobs.map((job) => (job.id === jobId ? updater(job) : job));
    updateLog({ jobs });
  };

  const addJob = () => {
    const next: Job = {
      id: uid(),
      jobNumber: `JOB-${log.jobs.length + 1}`,
      customerAccount: '',
      drops: [],
    };
    updateLog({ jobs: [...log.jobs, next] });
  };

  const removeJob = (jobId: string) => {
    updateLog({ jobs: log.jobs.filter((job) => job.id !== jobId) });
  };

  const usedCompartments = (job: Job) =>
    new Set(
      job.drops.flatMap((drop) =>
        (drop.cargos || []).map((c) => c.compartment),
      ),
    );

  const remainingCompartments = (job: Job) =>
    compartmentCount - usedCompartments(job).size;

  const addDrop = (jobId: string) => {
    updateJob(jobId, (job) => {
      if (remainingCompartments(job) <= 0) return job;
      return {
        ...job,
        drops: [
          ...job.drops,
          {
            id: uid(),
            customerName: job.customerAccount || '',
            deliveryAddress: '',
            cargos: [],
          },
        ],
      };
    });
  };

  const removeDrop = (jobId: string, dropId: string) => {
    updateJob(jobId, (job) => ({
      ...job,
      drops: job.drops.filter((d) => d.id !== dropId),
    }));
  };

  const addCargo = (jobId: string, dropId: string) => {
    updateJob(jobId, (job) => {
      const used = usedCompartments(job);
      if (used.size >= compartmentCount) return job;
      const firstFree = Array.from({ length: compartmentCount }, (_, i) => i + 1).find(
        (c) => !used.has(c),
      )!;
      return {
        ...job,
        drops: job.drops.map((drop) =>
          drop.id === dropId
            ? {
                ...drop,
                cargos: [
                  ...drop.cargos,
                  {
                    id: uid(),
                    cargoType: 'diesel',
                    liters: 0,
                    compartment: firstFree,
                  },
                ],
              }
            : drop,
        ),
      };
    });
  };

  const removeCargo = (jobId: string, dropId: string, cargoId: string) => {
    updateJob(jobId, (job) => ({
      ...job,
      drops: job.drops.map((drop) =>
        drop.id === dropId
          ? { ...drop, cargos: drop.cargos.filter((c) => c.id !== cargoId) }
          : drop,
      ),
    }));
  };

  const totalLiters = log.jobs.reduce(
    (sum, job) =>
      sum +
      job.drops.reduce(
        (dropSum, drop) => dropSum + drop.cargos.reduce((cSum, c) => cSum + c.liters, 0),
        0,
      ),
    0,
  );

  return (
    <div className="panel">
      <div className="panel__header">
        <div>
          <div className="eyebrow">{log.date}</div>
          <div className="title">Daily work log</div>
        </div>
        <div className="badge">{duration.label} worked</div>
      </div>

      <div className="grid two">
        <div className="field">
          <Label text="Driver" />
          <div className="input-with-action">
            <select
              value={log.driverId || ''}
              onChange={(e) => updateLog({ driverId: e.target.value })}
            >
              <option value="">Select driver</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <div className="quick-add">
              <input
                placeholder="Add driver"
                value={newDriver}
                onChange={(e) => setNewDriver(e.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  if (!newDriver.trim()) return;
                  const id = onCreateDriver(newDriver.trim());
                  updateLog({ driverId: id });
                  setNewDriver('');
                }}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="field">
          <Label text="Truck" />
          <div className="input-with-action">
            <select value={log.truckId || ''} onChange={(e) => updateLog({ truckId: e.target.value })}>
              <option value="">Select truck</option>
              {trucks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.plate}
                </option>
              ))}
            </select>
            <div className="quick-add">
              <input
                placeholder="Add truck plate"
                value={newTruck}
                onChange={(e) => setNewTruck(e.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  if (!newTruck.trim()) return;
                  const id = onCreateTruck(newTruck.trim());
                  updateLog({ truckId: id });
                  setNewTruck('');
                }}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="field">
          <Label text="Trailer" />
          <div className="input-with-action">
            <select
              value={log.trailerId || ''}
              onChange={(e) => updateLog({ trailerId: e.target.value })}
            >
              <option value="">Select trailer</option>
              {trailers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.plate} · {t.compartmentCount} comps
                </option>
              ))}
            </select>
            <div className="quick-add">
              <input
                placeholder="Add trailer plate"
                value={newTrailer}
                onChange={(e) => setNewTrailer(e.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  if (!newTrailer.trim()) return;
                  const id = onCreateTrailer(newTrailer.trim());
                  updateLog({ trailerId: id });
                  setNewTrailer('');
                }}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="field time-range">
          <div>
            <Label text="Start" />
            <input
              type="time"
              value={log.startTime || ''}
              onChange={(e) => updateLog({ startTime: e.target.value })}
            />
          </div>
          <div>
            <Label text="Finish" />
            <input
              type="time"
              value={log.endTime || ''}
              onChange={(e) => updateLog({ endTime: e.target.value })}
            />
          </div>
          <div className="badge subtle">{duration.label}</div>
        </div>
      </div>

      <div className="summary">
        <div>
          <div className="eyebrow">Loads</div>
          <div className="title">{totalLiters.toLocaleString()} L</div>
        </div>
        <div className="compartments">
          {compartmentTotals.map((liters, idx) => (
            <div key={idx} className="chip">
              Comp {idx + 1}: {liters.toLocaleString()} L
            </div>
          ))}
        </div>
      </div>

      <div className="jobs">
        <div className="section-title">
          <div>
            <div className="eyebrow">Jobs</div>
            <div className="title">{log.jobs.length || 0} added</div>
          </div>
          <button className="primary" onClick={addJob} type="button">
            + Add job
          </button>
        </div>

        {log.jobs.map((job, index) => (
          <div key={job.id} className="job-card">
            <div className="job-card__header">
              <div className="chip muted">#{index + 1}</div>
              <button className="ghost" onClick={() => removeJob(job.id)} aria-label="Remove job">
                Remove
              </button>
            </div>
            <div className="grid two">
              <div className="field">
                <Label text="Job number" />
                <input
                  value={job.jobNumber}
                  onChange={(e) =>
                    updateJob(job.id, (j) => ({ ...j, jobNumber: e.target.value }))
                  }
                  placeholder="Job reference"
                />
              </div>
              <div className="field">
                <Label text="Customer account" />
                <input
                  value={job.customerAccount}
                  onChange={(e) =>
                    updateJob(job.id, (j) => ({ ...j, customerAccount: e.target.value }))
                  }
                  placeholder="Customer / account"
                />
              </div>
            </div>

            <div className="drops">
              <div className="drops__title">
                <div className="eyebrow">Drops & cargos</div>
                <button
                  className="ghost"
                  onClick={() => addDrop(job.id)}
                  type="button"
                  disabled={job.drops.length >= compartmentCount}
                  title={job.drops.length >= compartmentCount ? 'All compartments used' : undefined}
                >
                  + Add delivery / drop
                </button>
              </div>

              {job.drops.length === 0 && <div className="muted">No cargo added yet.</div>}

              {job.drops.map((drop, idx) => {
                const used = usedCompartments(job);
                const remaining = remainingCompartments(job);
                return (
                  <div key={drop.id} className="drop-row stacked">
                    <div className="drop-actions">
                      <div className="chip muted">Drop {idx + 1}</div>
                      <button
                        className="ghost"
                        onClick={() => removeDrop(job.id, drop.id)}
                        aria-label="Remove drop"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid two">
                      <div className="field">
                        <Label text="Customer name" />
                        <input
                          value={drop.customerName}
                          onChange={(e) =>
                            updateJob(job.id, (j) => ({
                              ...j,
                              drops: j.drops.map((d) =>
                                d.id === drop.id ? { ...d, customerName: e.target.value } : d,
                              ),
                            }))
                          }
                          placeholder="Contact / store"
                        />
                      </div>
                      <div className="field full">
                        <Label text="Delivery address" />
                        <input
                          value={drop.deliveryAddress}
                          onChange={(e) =>
                            updateJob(job.id, (j) => ({
                              ...j,
                              drops: j.drops.map((d) =>
                                d.id === drop.id ? { ...d, deliveryAddress: e.target.value } : d,
                              ),
                            }))
                          }
                          placeholder="Street, depot, or customer location"
                        />
                      </div>
                    </div>

                    <div className="drop-cargos">
                      <div className="drops__title">
                        <div className="eyebrow">Cargos</div>
                        <button
                          className="ghost"
                          type="button"
                          onClick={() => addCargo(job.id, drop.id)}
                          disabled={remaining <= 0}
                          title={remaining <= 0 ? 'No free compartments left' : undefined}
                        >
                          + Add cargo
                        </button>
                      </div>

                      {(drop.cargos || []).length === 0 && (
                        <div className="muted">No cargo yet for this drop.</div>
                      )}

                      {(drop.cargos || []).map((cargo) => (
                        <div key={cargo.id} className="cargo-row">
                          <div className="field">
                            <Label text="Cargo" />
                            <select
                              value={cargo.cargoType}
                              onChange={(e) =>
                                updateJob(job.id, (j) => ({
                                  ...j,
                                  drops: j.drops.map((d) =>
                                    d.id === drop.id
                                      ? {
                                          ...d,
                                          cargos: d.cargos.map((c) =>
                                            c.id === cargo.id
                                              ? { ...c, cargoType: e.target.value as any }
                                              : c,
                                          ),
                                        }
                                      : d,
                                  ),
                                }))
                              }
                            >
                              {cargoOptions.map((c) => (
                                <option key={c.value} value={c.value}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="field">
                            <Label text="Liters" />
                            <input
                              type="number"
                              min={0}
                              step={10}
                              value={cargo.liters}
                              onChange={(e) =>
                                updateJob(job.id, (j) => ({
                                  ...j,
                                  drops: j.drops.map((d) =>
                                    d.id === drop.id
                                      ? {
                                          ...d,
                                          cargos: d.cargos.map((c) =>
                                            c.id === cargo.id
                                              ? { ...c, liters: Number(e.target.value) }
                                              : c,
                                          ),
                                        }
                                      : d,
                                  ),
                                }))
                              }
                            />
                          </div>
                          <div className="field">
                            <Label text="Compartment" />
                            <select
                              value={cargo.compartment}
                              onChange={(e) =>
                                updateJob(job.id, (j) => ({
                                  ...j,
                                  drops: j.drops.map((d) =>
                                    d.id === drop.id
                                      ? {
                                          ...d,
                                          cargos: d.cargos.map((c) =>
                                            c.id === cargo.id
                                              ? { ...c, compartment: Number(e.target.value) }
                                              : c,
                                          ),
                                        }
                                      : d,
                                  ),
                                }))
                              }
                            >
                              {Array.from({ length: compartmentCount }, (_, i) => i + 1).map((c) => {
                                const occupied = job.drops.some((d) =>
                                  d.cargos.some(
                                    (cc) => cc.compartment === c && cc.id !== cargo.id,
                                  ),
                                );
                                return (
                                  <option key={c} value={c} disabled={occupied}>
                                    {c} {occupied ? '(used)' : ''}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                          <div className="drop-actions">
                            <button
                              className="ghost"
                              onClick={() => removeCargo(job.id, drop.id, cargo.id)}
                              aria-label="Remove cargo"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="field">
        <Label text="Notes" />
        <textarea
          placeholder="Anything else worth remembering..."
          value={log.notes || ''}
          onChange={(e) => updateLog({ notes: e.target.value })}
        />
      </div>
    </div>
  );
}

export default WorkLogForm;

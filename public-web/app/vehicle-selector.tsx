"use client";

import { useEffect, useId, useState } from "react";
import { type VehicleRef, vehicleSelectorLabel } from "@/lib/catalog";
import styles from "./page.module.css";

type VehicleSelectorProps = {
  initialVehicle: VehicleRef | null;
};

export default function VehicleSelector({ initialVehicle }: VehicleSelectorProps) {
  const listboxId = useId();
  const [selected, setSelected] = useState<VehicleRef | null>(initialVehicle);
  const [text, setText] = useState(initialVehicle ? vehicleSelectorLabel(initialVehicle) : "");
  const [results, setResults] = useState<VehicleRef[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const query = text.trim();
    if (selected || query.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setStatus(null);
      try {
        const response = await fetch(`/api/vehicle-catalog?query=${encodeURIComponent(query)}`, {
          cache: "no-store",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) {
          throw new Error("catalog lookup failed");
        }
        const items = (await response.json()) as VehicleRef[];
        setResults(items);
        setStatus(items.length === 0 ? "Nenhum veículo encontrado." : `${items.length} opção(ões).`);
      } catch (reason: unknown) {
        if (reason instanceof DOMException && reason.name === "AbortError") {
          return;
        }
        setResults([]);
        setStatus("Não foi possível consultar o catálogo agora.");
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [selected, text]);

  function changeText(value: string) {
    setText(value);
    setResults([]);
    setStatus(null);
    setLoading(false);
    if (selected && value !== vehicleSelectorLabel(selected)) {
      setSelected(null);
    }
  }

  function choose(vehicle: VehicleRef) {
    const label = vehicleSelectorLabel(vehicle);
    setSelected(vehicle);
    setText(label);
    setResults([]);
    setStatus(`Selecionado: ${label}`);
  }

  function clear() {
    setSelected(null);
    setText("");
    setResults([]);
    setStatus(null);
    setLoading(false);
  }

  return (
    <div className={styles.vehicleSelector}>
      <label htmlFor="vehicle-catalog-query">Veículo exato</label>
      <div className={styles.vehicleSelectorControl}>
        <input
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={results.length > 0}
          autoComplete="off"
          id="vehicle-catalog-query"
          onChange={(event) => changeText(event.target.value)}
          placeholder="Busque marca, modelo, geração ou versão"
          role="combobox"
          type="search"
          value={text}
        />
        {selected ? (
          <button className={styles.clearVehicle} onClick={clear} type="button">
            Limpar veículo
          </button>
        ) : null}
      </div>
      <input name="vehicleId" type="hidden" value={selected?.id ?? ""} />
      {results.length > 0 ? (
        <ul className={styles.vehicleOptions} id={listboxId} role="listbox">
          {results.map((vehicle) => (
            <li key={vehicle.id} role="presentation">
              <button
                aria-selected="false"
                className={styles.vehicleOption}
                onClick={() => choose(vehicle)}
                role="option"
                type="button"
              >
                {vehicleSelectorLabel(vehicle)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <span aria-live="polite" className={styles.vehicleSelectorStatus}>
        {loading ? "Consultando catálogo…" : status}
      </span>
    </div>
  );
}

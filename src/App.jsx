import { useState } from "react";

const tracks = [
  "Этап 1 Автодром «Moscow Raceway»",
  "Этап 2 Автодром «Игора Драйв»",
  "Этап 3 Автодром «Нижегородское кольцо»",
  "Этап 4 Автодром «Казань Ринг»",
  "Этап 5 Автодром «Moscow Raceway»"
];

const drivers = [99, 97, 57, 49, 34, 50, 111, 45, 101];

function App() {
  const [track, setTrack] = useState(tracks[0]);
  const [times, setTimes] = useState({});

  const handleTimeChange = (driver, lap, value) => {
    setTimes(prev => ({
      ...prev,
      [driver]: {
        ...prev[driver],
        [lap]: value
      }
    }));
  };

  const renderInputs = () =>
    drivers.map(driver => (
      <tr key={driver}>
        <td className="px-4 py-2 text-center">{driver}</td>
        {Array.from({ length: 14 }).map((_, i) => (
          <td key={i} className="px-1 py-1">
            <input
              type="text"
              className="w-full px-2 py-1 rounded bg-[#2b2b2b] text-[#d1b979] text-center"
              value={times[driver]?.[i] || ""}
              onChange={e => handleTimeChange(driver, i, e.target.value)}
            />
          </td>
        ))}
      </tr>
    ));

  return (
    <div className="p-6 max-w-full">
      <div className="text-4xl font-bold mb-4 flex items-center gap-3">
        <span className="text-[#d1b979]">🏁 TEAMGARIS</span>
      </div>

      <select
        className="mb-6 p-2 bg-[#2b2b2b] text-[#d1b979] rounded"
        value={track}
        onChange={e => setTrack(e.target.value)}
      >
        {tracks.map(t => (
          <option key={t}>{t}</option>
        ))}
      </select>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">№</th>
              {[...Array(14).keys()].map(i => (
                <th key={i} className="px-2 py-2 text-center">{i + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>{renderInputs()}</tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
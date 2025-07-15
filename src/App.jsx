import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { format } from "date-fns";

const drivers = [
  { number: 99, name: "Харченко" },
  { number: 97, name: "Помогалов" },
  { number: 57, name: "Бирюков" },
  { number: 49, name: "Твердохлебов" },
  { number: 34, name: "Мирошниченко" },
  { number: 50, name: "Петровский" },
  { number: 111, name: "Самойлов" },
  { number: 45, name: "Храпыкин" },
  { number: 101, name: "Родионов" },
];

const sessions = [
  "2025-07-25 10:00", "2025-07-25 11:30", "2025-07-25 13:00",
  "2025-07-25 15:00", "2025-07-25 16:30", "2025-07-25 18:00",
  "2025-07-25 19:30", "2025-07-26 11:00", "2025-07-26 12:30",
  "2025-07-26 14:50", "2025-07-26 16:20", "2025-07-26 17:50",
  "2025-07-26 18:50", "2025-07-27 09:10", "2025-07-27 09:40",
  "2025-07-27 10:10", "2025-07-27 10:40", "2025-07-27 17:40",
  "2025-07-27 18:10", "2025-07-27 18:40", "2025-07-27 19:10",
  "2025-07-27 19:40",
];

export default function LapTimeDashboard() {
  const [lapTimes, setLapTimes] = useState({});

  const handleTimeChange = (session, number, lapIndex, value) => {
    setLapTimes((prev) => {
      const updated = { ...prev };
      updated[session] = updated[session] || {};
      updated[session][number] = updated[session][number] || Array(14).fill("");
      updated[session][number][lapIndex] = value;
      return updated;
    });
  };

  const getBestLap = (laps) => {
    return laps.reduce((min, val) => {
      const time = parseFloat(val);
      return !isNaN(time) && (min === null || time < min) ? time : min;
    }, null);
  };

  return (
    <Tabs defaultValue={sessions[0]} className="p-4">
      <TabsList className="overflow-x-auto whitespace-nowrap">
        {sessions.map((s) => (
          <TabsTrigger key={s} value={s} className="min-w-[140px]">
            {format(new Date(s), "dd.MM HH:mm")}
          </TabsTrigger>
        ))}
      </TabsList>

      {sessions.map((session) => (
        <TabsContent key={session} value={session}>
          <Card className="mt-4">
            <CardContent className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>№</TableHead>
                    <TableHead>Фамилия</TableHead>
                    {[...Array(14)].map((_, i) => (
                      <TableHead key={i}>Круг {i + 1}</TableHead>
                    ))}
                    <TableHead>Лучший</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map(({ number, name }) => {
                    const laps = lapTimes?.[session]?.[number] || Array(14).fill("");
                    const best = getBestLap(laps);
                    return (
                      <TableRow key={number}>
                        <TableCell>{number}</TableCell>
                        <TableCell>{name}</TableCell>
                        {laps.map((val, i) => (
                          <TableCell key={i}>
                            <Input
                              type="text"
                              value={val}
                              onChange={(e) =>
                                handleTimeChange(session, number, i, e.target.value)
                              }
                            />
                          </TableCell>
                        ))}
                        <TableCell className="font-bold text-green-700">
                          {best ?? "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}

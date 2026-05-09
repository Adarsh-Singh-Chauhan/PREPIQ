"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DEMO_SCHEDULE } from "@/lib/demo-data";
import { useAuth } from "@/lib/auth-context";
import { insertScheduleSlot } from "@/lib/supabase-db";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const hours = Array.from({ length: 16 }, (_, i) => i + 7);

const colorMap: Record<string, string> = {
  indigo: "bg-accent/20 border-accent/40 text-accent",
  cyan: "bg-accent-secondary/20 border-accent-secondary/40 text-accent-secondary",
  green: "bg-success/20 border-success/40 text-success",
  amber: "bg-warning/20 border-warning/40 text-warning",
};

// Item types for react-dnd
const ItemTypes = { SLOT: "slot" };

function getSlotPosition(start: string) {
  const [h, m] = start.split(":").map(Number);
  return (h - 7) * 60 + m;
}

function getSlotHeight(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

// Draggable Slot Component
const DraggableSlot = ({ slot, index, moveSlot }: any) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.SLOT,
    item: { id: index, ...slot },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  }));

  const top = (getSlotPosition(slot.start) / 60) * 48;
  const height = (getSlotHeight(slot.start, slot.end) / 60) * 48;

  const dragRef = useCallback((node: HTMLDivElement | null) => {
    drag(node);
  }, [drag]);

  return (
    <div
      ref={dragRef}
      className={`absolute left-0.5 right-0.5 rounded-lg border p-1.5 cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform ${colorMap[slot.color]} ${isDragging ? "opacity-50 z-50 shadow-2xl" : "shadow-md"}`}
      style={{ top: `${top}px`, height: `${height}px` }}
    >
      <p className="text-[10px] font-semibold truncate">{slot.topic}</p>
      <p className="text-[9px] opacity-70">{slot.start}-{slot.end}</p>
    </div>
  );
};

// Droppable Column Component
const DayColumn = ({ day, daySlots, moveSlot }: any) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.SLOT,
    drop: (item: any, monitor) => {
      // Calculate drop offset to determine new time
      const offset = monitor.getClientOffset();
      // For simplicity, we just change the day for now
      if (item.day !== day) {
        moveSlot(item.id, day);
      }
    },
    collect: (monitor) => ({ isOver: !!monitor.isOver() }),
  }));

  const dropRef = useCallback((node: HTMLDivElement | null) => {
    drop(node);
  }, [drop]);

  return (
    <div ref={dropRef} className={`relative transition-colors ${isOver ? "bg-white/5" : ""}`} style={{ height: `${hours.length * 48}px` }}>
      {hours.map((h) => (
        <div key={h} className="absolute w-full border-t border-border/50" style={{ top: `${(h - 7) * 48}px`, height: "48px" }} />
      ))}
      {daySlots.map((slot: any) => (
        <DraggableSlot key={slot.id} slot={slot} index={slot.id} moveSlot={moveSlot} />
      ))}
    </div>
  );
};

export default function SchedulePage() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState(
    DEMO_SCHEDULE.map((s, i) => ({ ...s, id: i }))
  );

  const moveSlot = useCallback((id: number, newDay: string) => {
    setSchedule((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, day: newDay } : s));
      // Track schedule change in Supabase
      const movedSlot = updated.find(s => s.id === id);
      if (movedSlot) {
        insertScheduleSlot({
          user_name: user?.name || 'Guest',
          day_of_week: newDay,
          start_time: movedSlot.start,
          end_time: movedSlot.end,
          topic: movedSlot.topic,
          color: movedSlot.color,
        });
      }
      return updated;
    });
  }, [user]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Calendar className="text-accent" size={20} />Interactive Drag-Drop Timetable
            </h2>
            <p className="text-sm text-text-secondary mt-1">Drag and drop sessions to reschedule them across days</p>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-4 overflow-x-auto bg-surface/80 backdrop-blur-xl border border-white/5 shadow-2xl">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid grid-cols-8 gap-1 mb-2">
              <div className="text-xs text-text-secondary p-2">Time</div>
              {days.map((d) => (
                <div key={d} className="text-xs font-semibold text-text-primary text-center p-2 bg-white/5 rounded-t-lg">{d.slice(0, 3)}</div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-8 gap-1">
              <div className="space-y-0">
                {hours.map((h) => (
                  <div key={h} className="h-12 flex items-start border-r border-border/50">
                    <span className="text-[10px] text-text-secondary pr-2">{h > 12 ? h - 12 : h}{h >= 12 ? "pm" : "am"}</span>
                  </div>
                ))}
              </div>

              {days.map((day) => {
                const daySlots = schedule.filter((s) => s.day === day);
                return <DayColumn key={day} day={day} daySlots={daySlots} moveSlot={moveSlot} />;
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </DndProvider>
  );
}

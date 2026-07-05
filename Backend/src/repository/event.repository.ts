import type {
    CreateEventDto,
    EventDbDto,
    EventItemsDto, QueryEventDto, UnsafeEventRow,
    UpdateEventPatchDto,
    UpdateEventPutDto
} from "../dto/event.dto.js";
import {run, get, all, type RunResult} from "../db/dbClient.js";
import {mapFromDbtoEventDto} from "../dto/dto.func.js";
import {getEventByID} from "../service/event.service.js";
import type {Paginated} from "../types/pagineted.type.js";

export async function getEvents(query: QueryEventDto): Promise<Paginated<EventItemsDto>>  {
    let whereCondition = "1=1";
    let orderByCondition = "ORDER BY event_id ASC";
    const limit = Number(query.limit ?? 10);
    const offset = Number(query.offset ?? 0);
    const values = [];
    if (query.search) {
        const search = String(query.search.toLowerCase());
        whereCondition = "name LIKE ?";
        values.push(`%${search}%`);
    }
    if (query.sortBy) {
        if (query.sortBy === "number_sorter") {
            orderByCondition = "ORDER BY event_id ASC";
        }
        if (query.sortBy === "name_sorter") {
            orderByCondition = "ORDER BY name ASC";
        }
        if (query.sortBy === "capacity_sorter") {
            orderByCondition = "ORDER BY capacity ASC";
        }
        if (query.sortBy === "date_sorter") {
            orderByCondition = "ORDER BY date ASC";
        }
    }
    const countSql = `SELECT COUNT(*) AS cnt FROM events WHERE ${whereCondition}`;
    const countResult = await get<any>(countSql, values);
    orderByCondition += " LIMIT ? OFFSET ?";
    values.push(limit, offset);

    const sqlRow = `SELECT event_id, name, date, location, capacity, description, created_at, updated_at
                    FROM events
                    WHERE ${whereCondition}
                    ${orderByCondition}`;
    const events = await all<EventDbDto>(sqlRow, values);
    const total: number = countResult.cnt;
    return {data : events.map(mapFromDbtoEventDto), total};
}
export async function getEventById(
  id: number,
): Promise<EventItemsDto | null> {
  const event = await get<EventDbDto>("SELECT event_id, name, date , location , capacity, description, created_at," +
      " updated_at FROM events WHERE event_id=?", [id]);
  if (!event) {
      return null;
  }
  return mapFromDbtoEventDto(event);
}
export async function unsafeGetEventById(id: string) {
    const sql = `SELECT event_id, name, date, location, capacity, description
               FROM Events
               WHERE event_id = ${id}`;
    const event = await all<UnsafeEventRow>(sql);
    return event
}
export async function getRegistrationsCount(eventId: number): Promise<number> {
    const row = await get<{ cnt: number }>(
        "SELECT COUNT(*) AS cnt FROM Registrations WHERE event_id = ?",
        [Number(eventId)]
    );
    return row?.cnt ?? 0;
}
export async function addEvent(event: CreateEventDto): Promise<EventItemsDto | null> {
  const sql = "INSERT INTO events (name, date, location, capacity, description) VALUES (?, ?, ?, ?, ?)";
  const runEventResult = await run(sql, [event.name, event.date, event.location, event.capacity, event.description])
  const eventDb = await getEventByID(runEventResult.lastID)
  if (!eventDb) {
      return null;
  }
  return eventDb;
}
export async function updateEventPatch(
  id: number,
  payload: UpdateEventPatchDto,
): Promise<RunResult> {
    const fields = [];
    const values = [];
    if (payload.name !==undefined) {
        fields.push("name = ?");
        values.push(payload.name);
    }
    if (payload.date !== undefined) {
        fields.push("date = ?");
        values.push(payload.date);
    }
    if (payload.location !== undefined) {
        fields.push("location = ?");
        values.push(payload.location);
    }
    if (payload.capacity !== undefined) {
        fields.push("capacity = ?");
        values.push(payload.capacity);
    }
    if (payload.description !== undefined) {
        fields.push("description = ?");
        values.push(payload.description);
    }
    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    console.log("fields", fields.length)
    values.push(id);
    const sql = `UPDATE events
                 SET ${fields.join(", ")}
                 WHERE event_id = ?`;
    return run(sql, values);
}

    export async function updateEventPut(
        id: number,
        payload: UpdateEventPutDto,
    ): Promise<RunResult> {
        return run("UPDATE events SET name=?, date=?, location=?, capacity=?, description=?, updated_at=? WHERE event_id=?",
            [payload.name, payload.date, payload.location, payload.capacity, payload.description, new Date().toISOString(), id])
    }

    export async function deleteEvent(id: number): Promise<boolean | null> {
        const runDbResult = await run("DELETE FROM events WHERE event_id=?", [Number(id)])
        if (runDbResult.changes === 0) {
            return null;
        }
        return true;
    }

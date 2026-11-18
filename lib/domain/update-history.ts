import type { UpdateRecord } from "../../types/domain";
export type HistoryFilters={query:string;year:string;month:string;day:string;includeRejected:boolean};
export function filterUpdateHistory(updates:UpdateRecord[], filters:HistoryFilters) {
  return updates.filter(update=>{
    const date=update.happenedAt.slice(0,10);
    return (filters.includeRejected||update.status!=="rejected") && (!filters.year||date.slice(0,4)===filters.year) && (!filters.month||date.slice(5,7)===filters.month) && (!filters.day||date===filters.day) && `${update.projectName} ${update.vendorName} ${update.description} ${update.whyItMatters||""}`.toLowerCase().includes(filters.query.trim().toLowerCase());
  }).sort((a,b)=>b.happenedAt.localeCompare(a.happenedAt)||b.createdAt.localeCompare(a.createdAt));
}

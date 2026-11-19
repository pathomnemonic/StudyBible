import { driveRequest } from './drive';
import { isSyncFileName, type DriveFile, type DriveFiles } from './driveSyncBackend';

/** The real file access for Drive sync: the hidden app folder of the signed-in person's own Drive, reached straight from the browser. */
export function realDriveFiles(interactive = false): DriveFiles {
  const meta = (j: any): DriveFile => ({ id: j.id, name: j.name, createdTime: Date.parse(j.createdTime) || 0, size: +j.size || 0 });
  return {
    async list() {
      const out: DriveFile[] = [];
      let page = '';
      do {
        const q = encodeURIComponent("name contains 'sbs-' and trashed = false");
        const r = await driveRequest(`/drive/v3/files?spaces=appDataFolder&q=${q}&pageSize=1000&fields=nextPageToken,files(id,name,createdTime,size)${page ? `&pageToken=${encodeURIComponent(page)}` : ''}`, { interactive });
        const j = await r.json();
        for (const f of j.files ?? []) if (isSyncFileName(f.name)) out.push(meta(f));
        page = j.nextPageToken ?? '';
      } while (page);
      return out;
    },
    async read(id) { return (await driveRequest(`/drive/v3/files/${encodeURIComponent(id)}?alt=media`, { interactive })).text(); },
    async create(name, body) {
      const boundary = 'sbsync' + Math.random().toString(36).slice(2);
      const multipart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name, parents: ['appDataFolder'] })}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`;
      const r = await driveRequest('/upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime,size', { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body: multipart, interactive });
      return meta(await r.json());
    },
    async remove(id) { await driveRequest(`/drive/v3/files/${encodeURIComponent(id)}`, { method: 'DELETE', interactive }); },
  };
}

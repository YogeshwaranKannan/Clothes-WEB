import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const STORAGE_KEY = 'pc_wishlist_v1';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  
  private idsSub = new BehaviorSubject<string[]>(this._load());
  ids$ = this.idsSub.asObservable();

  private _load(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  private _save(ids: string[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch (e) {
      // ignore
    }
  }

  getIds(): string[] {
    //console.log("wishlist getids, ids:",this.idsSub.value.slice());
    return this.idsSub.value.slice();
  }

  has(id: string) {
    return this.getIds().includes(id);
  }

  add(id: string) {
    const ids = this.getIds();
    console.log("wishlist - added, id: ",id);
    if (!ids.includes(id)) {
      ids.push(id);
      this._save(ids);
      this.idsSub.next(ids);
    }
  }

  remove(id: string) {
    const ids = this.getIds().filter((x) => x !== id);
    this._save(ids);
    this.idsSub.next(ids);
  }

  toggle(id: string) {
    if (this.has(id)) this.remove(id);
    else this.add(id);
  }
}

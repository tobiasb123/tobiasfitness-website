import { TestBed } from '@angular/core/testing';
import { DocumentFile } from '@models/storage';
import { FirebaseService } from '@modules/firebase';
import { vi } from 'vitest';
import { FIREBASE_APP } from '../../firebase/tokens/firebase-app.token';
import { StorageFunctions } from './storage-functions.service';

describe('StorageFunctions recipe updates', () => {
  const firebase = { httpPost: vi.fn() };
  const document: DocumentFile = {
    id: 'recipe-1',
    uid: 'all',
    filePath: '',
    fileType: 'recipe',
    fileName: '',
    folderPath: '',
    fileUrl: '',
    timeCreated: '',
    recipe: { title: 'Meal', category: 'lunch', ingredients: [], instructions: [], macros: [] },
  };
  let service: StorageFunctions;

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: FirebaseService, useValue: firebase },
        { provide: FIREBASE_APP, useValue: {} },
      ],
    });
    service = TestBed.inject(StorageFunctions);
  });

  it('accepts a server-confirmed category', async () => {
    firebase.httpPost.mockResolvedValue({ recipe: document.recipe });
    await expect(service.updateRecipe(document)).resolves.toBeUndefined();
    expect(firebase.httpPost).toHaveBeenCalledWith('storage-editRecipe', document);
  });

  it('rejects a response from an outdated server that does not confirm the category', async () => {
    firebase.httpPost.mockResolvedValue(null);
    await expect(service.updateRecipe(document)).rejects.toThrow('kategorien blev ikke bekræftet');
  });

  it('rejects a response with a different saved category', async () => {
    firebase.httpPost.mockResolvedValue({ recipe: { ...document.recipe, category: 'dinner' } });
    await expect(service.updateRecipe(document)).rejects.toThrow('kategorien blev ikke bekræftet');
  });
});

export interface CharacterReference {
  id: string;
  displayName: string;
  canonicalAssetIds: string[];
  identityPrompt: string;
  voiceId?: string;
}

export class CharacterRegistry {
  private readonly characters = new Map<string, CharacterReference>();

  register(character: CharacterReference): void {
    if (this.characters.has(character.id)) throw new Error(`Character already registered: ${character.id}`);
    if (character.canonicalAssetIds.length === 0) throw new Error(`Character ${character.id} requires a canonical asset`);
    this.characters.set(character.id, character);
  }

  require(id: string): CharacterReference {
    const character = this.characters.get(id);
    if (!character) throw new Error(`Unknown character: ${id}`);
    return character;
  }

  resolveAssets(ids: readonly string[]): string[] {
    return [...new Set(ids.flatMap((id) => this.require(id).canonicalAssetIds))];
  }
}

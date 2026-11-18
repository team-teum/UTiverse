import { sandboxRepository } from "./sandboxRepository";
import type { Repository } from "./types";

/** 지금은 샌드박스만 있다. 실제 DB 모드를 붙일 때 여기서 구현을 고른다. */
export const repo: Repository = sandboxRepository;

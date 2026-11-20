import { createSandboxRepository } from "./sandboxRepository";

/** 앱에서 공유할 저장소 인스턴스를 한 곳에서 만든다. */
export const repo = createSandboxRepository();

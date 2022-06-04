import {Env} from "./src";

declare global {
  function getMiniflareBindings(): Env;
  function getMiniflareDurableObjectStorage(
    id: DurableObjectId
  ): Promise<DurableObjectStorage>;
}


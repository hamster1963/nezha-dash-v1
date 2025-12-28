"use client"

import { useCommand } from "@/hooks/use-command"
import { cn } from "@/lib/utils"
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid"

import { Button } from "./ui/button"

export function SearchButton() {
  const { openCommand } = useCommand()

  const customBackgroundImage = (window.CustomBackgroundImage as string) !== "" ? window.CustomBackgroundImage : undefined

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("rounded-full px-[9px] bg-white dark:bg-black", {
        "bg-white/70 dark:bg-black/70": customBackgroundImage,
      })}
      onClick={openCommand}
      title="Search"
    >
      <MagnifyingGlassIcon className="size-4" />
      <span className="sr-only">Search</span>
    </Button>
  )
}

"use client"

import {cn} from "@/lib/utils";
import Image from "next/image";
import {useBoard} from "@/lib/chess/useBoard";
import {useEffect, useState} from "react";


export default function Home() {
    const {board, pieceToSvg, movePiece, getPieceLegalMoves} = useBoard()
    const [grabbedPiece, setGrabbingPiece] = useState<number | null>(null)
    const [grabbedPieceLegalMoves, setGrabbedPieceLegalMoves] = useState<number[] | null>(null)

    useEffect(() => {
        if (grabbedPiece === null) {
            setGrabbedPieceLegalMoves(null)
            return
        }
        getPieceLegalMoves(grabbedPiece).then((moves) => {
            if (!moves) return
            setGrabbedPieceLegalMoves(moves)
        })
    }, [grabbedPiece])

    async function onMovePiece(from: number, to: number) {
        await movePiece(from, to)
        setGrabbingPiece(null)
    }

    return <div className={"w-screen h-screen flex items-center justify-center select-none "}>
        <div className={cn("grid grid-cols-8 shrink-0")}>
            {board.map((piece, index) => (
                <div key={index}
                     onDrop={(e) => {
                         if (grabbedPiece !== null)
                             onMovePiece(grabbedPiece, index)
                     }}
                     onDragOver={(e) => {
                         e.preventDefault();
                     }}
                     onClick={() => {
                         if (grabbedPiece !== null) {
                             if (grabbedPieceLegalMoves?.includes(index))
                                 onMovePiece(grabbedPiece, index)
                             else {
                                 if (piece && piece.length > 0)
                                     setGrabbingPiece(index)
                             }
                         } else if (piece && piece.length > 0)
                             setGrabbingPiece(index)
                     }}
                     className={cn(
                         "w-[50px] h-[50px] sm:w-[70px] sm:h-[70px] 2xl:w-[100px] 2xl:h-[100px] flex items-center justify-center",
                         (index % 2 === Math.floor(index / 8) % 2) ? "bg-white" : "bg-green-800",
                         index === grabbedPiece ? "bg-blue-500" : "",
                         grabbedPieceLegalMoves?.includes(index) ? "bg-blue-300" : "",
                         piece && piece.length > 0 ? "cursor-grab" : ""
                     )}>

                    {piece && piece.length > 0 &&
                        <Image draggable={true}
                               onDragStart={(e) => {
                                   setGrabbingPiece(index)
                               }}
                               onClick={() => {
                                   setGrabbingPiece(index)
                               }}
                               src={`/chess-pieces/${pieceToSvg(piece[0]!, piece[1]!)}`}
                               alt={"pice"}
                               className={"cursor-grab"}
                               width={80}
                               height={80}/>}
                </div>
            ))}
        </div>
    </div>
}

// 1 pawn
// 2 knight
// 3 bishop
// 4 rook
// 5 queen
// 6 king

// 0 white
// 1 black

import {useEffect, useState} from "react";

export type ChessPiece = 1 | 2 | 3 | 4 | 5 | 6
export type Color = 0 | 1

export type ChessPiecePlacement = null | [Color, ChessPiece]

export function useBoard() {
    const [turn, setTurn] = useState<Color>(0)
    const [board, setBoard] = useState<ChessPiecePlacement[]>([])
    const [enPassantSquare, setEnPassantSquare] = useState<number | null>(null);

    useEffect(() => {
        for (let i = 0; i < 64; i++)
            setBoard(board => [...board, null])

        fenToBoard("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
    }, [])

    function legalPawnMoves(from: number, color: Color) {
        let moves: number[] = [];

        const forwardOne = color === 0 ? from - 8 : from + 8;
        if (!board[forwardOne]) {
            moves.push(forwardOne);
            const forwardTwo = color === 0 ? from - 16 : from + 16;
            if ((color === 0 && from >= 48 && from <= 55) || (color === 1 && from >= 8 && from <= 15)) {
                if (!board[forwardTwo]) {
                    moves.push(forwardTwo);
                }
            }
        }

        const leftCapture = color === 0 ? from - 9 : from + 9;
        if (board[leftCapture] && board[leftCapture]![0] !== color) {
            moves.push(leftCapture);
        } else if (leftCapture === enPassantSquare) {
            moves.push(leftCapture);
        }

        const rightCapture = color === 0 ? from - 7 : from + 7;
        if (board[rightCapture] && board[rightCapture]![0] !== color) {
            moves.push(rightCapture);
        } else if (rightCapture === enPassantSquare) {
            moves.push(rightCapture);
        }

        return moves;
    }


    function legalKnightMoves(from: number, color: Color) {
        let moves: number[] = []

        const offsets = [-17, -15, -10, -6, 6, 10, 15, 17]

        for (const offset of offsets) {
            const to = from + offset
            if (to < 0 || to >= 64) continue
            if (Math.abs(from % 8 - to % 8) > 2) continue
            if (board[to] && board[to]![0] === color) continue
            moves.push(to)
        }

        return moves
    }

    async function legalBishopMoves(from: number, color: Color) {
        let moves: number[] = [];

        const calculateMoves = async (increment: number) => {
            let localMoves: number[] = [];
            for (let i = 1; i < 8; i++) {
                const to = from + i * increment;
                if (to < 0 || to >= 64) break;
                if (Math.abs(from % 8 - to % 8) !== Math.abs(Math.floor(from / 8) - Math.floor(to / 8))) break;
                if (board[to] && board[to]![0] === color) break;
                localMoves.push(to);
                if (board[to]) break;
            }
            return localMoves;
        };

        const results = await Promise.all([
            calculateMoves(7),
            calculateMoves(9),
            calculateMoves(-7),
            calculateMoves(-9),
        ]);

        for (let i = 0; i < results.length; i++) {
            moves = [...moves, ...results[i]];
        }

        return moves;
    }

    async function legalRookMoves(from: number, color: Color) {
        let moves: number[] = [];

        const calculateMoves = async (increment: number) => {
            let localMoves: number[] = [];
            for (let i = 1; i < 8; i++) {
                const to = from + i * increment;
                if (to < 0 || to >= 64) break;
                if (Math.floor(from / 8) !== Math.floor(to / 8) && from % 8 !== to % 8) break;
                if (board[to] && board[to]![0] === color) break;
                localMoves.push(to);
                if (board[to]) break;
            }
            return localMoves;
        };

        const results = await Promise.all([
            calculateMoves(1),
            calculateMoves(-1),
            calculateMoves(8),
            calculateMoves(-8),
        ]);

        for (let i = 0; i < results.length; i++) {
            moves = [...moves, ...results[i]];
        }

        return moves;
    }


    async function legalQueenMoves(from: number, color: Color) {
        let moves: number[] = []

        const results = await Promise.all([
            legalBishopMoves(from, color),
            legalRookMoves(from, color)
        ])

        for (let i = 0; i < results.length; i++) {
            moves = [...moves, ...results[i]]
        }

        return moves
    }

    async function legalKingMoves(from: number, color: Color) {
        let moves: number[] = []

        const offsets = [-9, -8, -7, -1, 1, 7, 8, 9]

        for (const offset of offsets) {
            const to = from + offset
            if (to < 0 || to >= 64) continue
            if (Math.abs(from % 8 - to % 8) > 1) continue
            if (board[to] && board[to]![0] === color) continue
            moves.push(to)
        }

        return moves
    }

    async function getPieceLegalMoves(from: number) {
        if (board[from] == null) return
        const color = board[from]![0]
        if (color !== turn) return
        const piece = board[from]![1]

        switch (piece) {
            case 1:
                return legalPawnMoves(from, color)
            case 2:
                return legalKnightMoves(from, color)
            case 3:
                return await legalBishopMoves(from, color)
            case 4:
                return await legalRookMoves(from, color)
            case 5:
                return await legalQueenMoves(from, color)
            case 6:
                return await legalKingMoves(from, color)
        }
    }

    async function isKingInCheck(color: Color) {
        let kingPosition = -1;

        for (let i = 0; i < board.length; i++)
            if (board[i] && board[i]![0] === color && board[i]![1] === 6) {
                kingPosition = i;
                break;
            }

        if (kingPosition === -1) return false;

        const opponentMoves = await getAllPossibleOpponentMoves(color === 0 ? 1 : 0);

        if (opponentMoves.includes(kingPosition))
            return true;

        return false
    }

    async function getAllPossibleOpponentMoves(color: Color) {
        let moves: number[] = [];
        for (let i = 0; i < board.length; i++) {
            if (board[i] && board[i]![0] === color) {
                const pieceMoves = await getPieceLegalMoves(i);
                if (pieceMoves) {
                    moves = [...moves, ...pieceMoves];
                }
            }
        }
        return moves;
    }

    async function movePiece(from: number, to: number) {
        const legalMoves = await getPieceLegalMoves(from)

        if (!legalMoves)
            return

        if (!legalMoves.includes(to))
            return

        const color = board[from]![0];
        const piece = board[from]![1];

        const isCheck = await isKingInCheck(color);

        console.log(isCheck)

        if (piece === 1 && Math.abs(from - to) === 16) {
            const captureSquare = color === 0 ? to + 8 : to - 8;
            setEnPassantSquare(captureSquare);
        } else {
            setEnPassantSquare(null);
        }

        if (piece === 1 && (Math.abs(from - to) === 9 || Math.abs(from - to) === 7) && !board[to]) {
            const captureSquare = color === 0 ? to + 8 : to - 8;
            board[captureSquare] = null;
        }

        board[to] = board[from]
        board[from] = null

        setTurn(turn === 0 ? 1 : 0)
        setBoard([...board])
    }

    function pieceToSvg(color: Color, piece: ChessPiece, reversed: boolean = false): string {
        const colorString = color === 0 ? 'w' : 'b'
        let pieceString = reversed ? 'r' + colorString : colorString
        switch (piece) {
            case 1:
                pieceString = pieceString + 'p'
                break
            case 2:
                pieceString = pieceString + 'n'
                break
            case 3:
                pieceString = pieceString + 'b'
                break
            case 4:
                pieceString = pieceString + 'r'
                break
            case 5:
                pieceString = pieceString + 'q'
                break
            case 6:
                pieceString = pieceString + 'k'
                break
        }
        return pieceString + '.svg'
    }

    function charToPiece(char: string): ChessPiece {
        switch (char) {
            case "p":
                return 1
            case "n":
                return 2
            case "b":
                return 3
            case "r":
                return 4
            case "q":
                return 5
            case "k":
                return 6
        }
        return 1
    }

    function fenToBoard(fen: string) {
        let rank = 7
        let file = 0
        for (let i = 0; i < fen.length; i++) {
            if (fen[i] === '/') {
                rank--
                file = 0
            } else if (parseInt(fen[i]) > 0) {
                file += parseInt(fen[i])
            } else {
                board[rank * 8 + file] = [fen[i] === fen[i].toLowerCase() ? 0 : 1, charToPiece(fen[i].toLowerCase())]
                setBoard([...board])
                file++
            }
        }
    }

    return {
        board,
        turn,
        movePiece,
        pieceToSvg,
        getPieceLegalMoves,
    }
}
import React, { useEffect, useRef, useState } from 'react';
import '../RainGrid.css'; // Ensure this file exists

const Rain = ({ rows = 20, cols = 25, blockSize = 6, fallingSpeed = 40 }) => {
    const gridRef = useRef([]);
    const [blockPositions, setBlockPositions] = useState(Array.from({ length: cols }, () => -1));
    const [fallingInterval, setFallingInterval] = useState(null);
    const [round, setRound] = useState(0); // Track the current round

    useEffect(() => {
        startFalling();
        return () => clearInterval(fallingInterval);
    }, []);

    const startFalling = () => {
        const newBlockPositions = Array.from({ length: cols }, () => -1);
        const numberOfColumnsToActivate = Math.floor(Math.random() * 4) + 2; // Random number between 2 and 5
        const newActiveColumns = selectRandomColumns(numberOfColumnsToActivate);

        newActiveColumns.forEach((colIndex) => {
            newBlockPositions[colIndex] = 0; // Start falling from the top (row 0)
        });

        setBlockPositions(newBlockPositions);

        const interval = setInterval(() => {
            setBlockPositions((prevPositions) => {
                return prevPositions.map((pos, colIndex) => {
                    if (newBlockPositions[colIndex] !== -1) {
                        const newPos = pos + 1;
                        if (newPos >= rows) {
                            newBlockPositions[colIndex] = -1; // Stop falling
                            return -1; // Indicate no block visible
                        }
                        return newPos; // Move down
                    }
                    return pos; // Keep position the same for inactive columns
                });
            });

            // Check if any column is within 4 to 5 rows from the bottom
            const nearBottom = blockPositions.some(pos => pos >= rows - 5);

            // If any column is near the bottom, start a new round
            if (nearBottom) {
                setRound((prevRound) => (prevRound + 1) % 3); // Move to the next round
                const newColumn = selectRandomColumns(1); // Select one new random column
                if (newBlockPositions[newColumn[0]] === -1) {
                    newBlockPositions[newColumn[0]] = 0; // Start new column falling from the top
                }
            }

            // Check if blocks have reached the bottom
            if (newBlockPositions.every(pos => pos === -1)) {
                clearInterval(interval);
                setRound((prevRound) => prevRound + 1); // Increment round
                setTimeout(() => {
                    removeBlocks();
                }, fallingSpeed);
            }
        }, fallingSpeed);

        setFallingInterval(interval);
    };

    const selectRandomColumns = (limit) => {
        const selectedColumns = new Set();
        while (selectedColumns.size < limit) {
            const randomCol = Math.floor(Math.random() * cols);
            selectedColumns.add(randomCol);
        }
        return Array.from(selectedColumns);
    };

    const removeBlocks = () => {
        const updatedPositions = [...blockPositions];
        const newRemovingBlocks = [];

        // Check each column for blocks to remove
        updatedPositions.forEach((pos, colIndex) => {
            // Calculate how many blocks are present in the column
            const blocksInColumn = Math.floor(pos / blockSize);

            // Remove every fifth block from the bottom
            if (blocksInColumn > 0 && blocksInColumn % 5 === 0) {
                const blockToRemove = (blocksInColumn - 1) * blockSize + (blockSize - 1); // Last block of the fifth block group
                const currentBlockElement = gridRef.current[colIndex][blockToRemove];
                currentBlockElement.classList.add('shrinking'); // Add shrinking class

                setTimeout(() => {
                    updatedPositions[colIndex] = -1; // Remove block after shrinking
                    currentBlockElement.classList.remove('shrinking'); // Remove shrinking class
                }, 500); // Duration of shrinking effect

                newRemovingBlocks.push(colIndex); // Mark for removal
            }
        });

        setBlockPositions(updatedPositions);

        // Start a new falling cycle if blocks have been removed
        if (newRemovingBlocks.length > 0) {
            setTimeout(() => {
                removeBlocks();
            }, fallingSpeed);
        } else {
            startFalling();
        }
    };

    const updateGrid = () => {
        gridRef.current.forEach((column, colIndex) => {
            const blockStart = blockPositions[colIndex];

            column.forEach((cell, rowIndex) => {
                // Show block only when it's falling down
                const isInBlock = blockStart !== -1 && blockStart <= rowIndex && rowIndex < blockStart + blockSize;

                // Set color if in block, otherwise keep it transparent
                if (isInBlock) {
                    const blockIndex = rowIndex - blockStart; // Determine the index of the block within the falling group
                    cell.style.backgroundColor = getColorShade(blockIndex); // Set color based on block index
                } else {
                    cell.style.backgroundColor = 'black'; // Keep black for empty
                }
            });
        });
    };

    const getColorShade = (blockIndex) => {
        // Define colors for rounds
        const colorsRound1 = ['#063b00', '#0a5d00', '#089000', '#1fc600', "#0eff00", '#9BEC00']; // Round 1 colors
        const colorsRound2 = ['#333300', '#666600', '#999900', '#CCCC00', '#FFFF00', '#FFFF33']; // Round 2 colors
        const colorsRound3 = ['#002855', '#023e7d', '#0353a4', '#0466c8', '#6F00FF', '#4B0082']; // Round 3 colors

        // Return colors based on the current round and block index
        if (round % 3 === 0) {
            return colorsRound1[blockIndex % colorsRound1.length]; // Round 1 colors
        } else if (round % 3 === 1) {
            return colorsRound2[blockIndex % colorsRound2.length]; // Round 2 colors
        } else {
            return colorsRound3[blockIndex % colorsRound3.length]; // Round 3 colors
        }
    };

    useEffect(() => {
        updateGrid(); // Update grid whenever blockPositions change
    }, [blockPositions]); // Update grid on blockPositions change

    useEffect(() => {
        updateGrid(); // Update grid whenever round changes to ensure colors change
    }, [round]);

    return (
        <div className="rain-grid">
            {Array.from({ length: cols }).map((_, colIndex) => (
                <div className="rain-column" key={colIndex}>
                    {Array.from({ length: rows }).map((_, rowIndex) => (
                        <div
                            className="rain-square"
                            key={rowIndex}
                            ref={(el) => {
                                if (!gridRef.current[colIndex]) {
                                    gridRef.current[colIndex] = [];
                                }
                                gridRef.current[colIndex][rowIndex] = el;
                            }}
                        ></div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default Rain;
 
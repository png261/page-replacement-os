// DOM Elements
const elements = {
    algorithm: document.getElementById('select-algorithm'),
    numOfFrames: document.getElementById('num-of-frames'),
    refString: document.getElementById('ref-string'),
    separator: document.getElementById('separator'),
    visualPageFrames: document.getElementById('visual-page-frames'),
    conclusion: document.getElementById('conclusion'),
    frameInfo: document.getElementById('frame-info'),
    frameSubInfo: document.getElementById('frame-sub-info'),
    runBtn: document.getElementById('runBtn'),
};

// State
let refStringArray = elements.refString.value.split(elements.separator.value || " ");
let frames = parseInt(elements.numOfFrames.value);

const EMPTY_FRAME = '-'
const initializeFrames = (count) => Array(count).fill().map(() => [EMPTY_FRAME, EMPTY_FRAME]);

const findFrameIndex = (frames, condition) => frames.findIndex(condition);

const getMinValueIndex = (frames, accessor) => {
    if (!frames.length) return -1;

    let minIndex = 0;
    let minValue = frames[0][1][accessor];

    for (let i = 1; i < frames.length; i++) {
        const value = frames[i][1][accessor];
        if (value < minValue) {
            minValue = value;
            minIndex = i;
        }
    }

    return minIndex;
};

const getMaxValueIndex = (frames, accessor) => {
    if (!frames.length) return -1;

    let maxIndex = 0;
    let maxValue = frames[0][1][accessor];

    for (let i = 1; i < frames.length; i++) {
        const value = frames[i][1][accessor];
        if (value > maxValue) {
            maxValue = value;
            maxIndex = i;
        }
    }

    return maxIndex;
};

const getFrameIndex = (frames, targetRef) => {
    return frames.findIndex((item) => item[0] === targetRef)
}

const algorithms = {
    FIFO: (frames, ref, index) => {
        const refIndex = getFrameIndex(frames, ref)
        if (refIndex === -1) {
            const emptyIndex = getFrameIndex(frames, EMPTY_FRAME)
            const targetIndex = emptyIndex !== -1 ? emptyIndex : getMinValueIndex(frames, 1)
            frames[targetIndex] = [ref, index];
        }
    },

    LRU: (frames, ref, index) => {
        const refIndex = getFrameIndex(frames, ref)
        if (refIndex === -1) {
            const emptyIndex = getFrameIndex(frames, EMPTY_FRAME)
            const targetIndex = emptyIndex !== -1 ? emptyIndex : getMinValueIndex(frames, 1)
            frames[targetIndex] = [ref, index];
        } else {
            frames[refIndex][1] = index;
        }
    },

    MRU: (frames, ref, index) => {
        const refIndex = getFrameIndex(frames, ref)
        if (refIndex === -1) {
            const emptyIndex = getFrameIndex(frames, EMPTY_FRAME)
            const targetIndex = emptyIndex !== -1 ? emptyIndex : getMaxValueIndex(frames, 1)
            frames[targetIndex] = [ref, index];
        } else {
            frames[refIndex][1] = index;
        }
    },

    LFU: (frames, ref, index) => {
        const refIndex = getFrameIndex(frames, ref)
        const emptyIndex = getFrameIndex(frames, EMPTY_FRAME)
        if (refIndex === -1) {
            if (emptyIndex !== -1) {
                frames[emptyIndex] = [ref, [1, index]];
            } else {
                const leastFrequent = frames.filter((item) => item[1][0] === Math.min(...frames.map((f) => f[1][0])));
                const victim = leastFrequent.find((item) => item[1][1] === Math.min(...leastFrequent.map((f) => f[1][1])));
                frames[findFrameIndex(frames, (item) => item[0] === victim[0])] = [ref, [1, index]];
            }
        } else {
            frames[refIndex][1][0]++;
        }
    },

    MFU: (frames, ref, index, isFull) => {
        const refIndex = getFrameIndex(frames, ref)
        const emptyIndex = getFrameIndex(frames, EMPTY_FRAME)
        if (refIndex === -1) {
            if (!isFull) {
                frames[emptyIndex] = [ref, [1, index]];
            } else {
                const mostFrequent = frames.filter((item) => item[1][0] === Math.max(...frames.map((f) => f[1][0])));
                const victim = mostFrequent.find((item) => item[1][1] === Math.min(...mostFrequent.map((f) => f[1][1])));
                frames[findFrameIndex(frames, (item) => item[0] === victim[0])] = [ref, [1, index]];
            }
        } else {
            frames[refIndex][1][0]++;
        }
    },

    '2ND': (frames, ref, index, isFull, frameCount) => {
        const refIndex = getFrameIndex(frames, ref)
        const emptyIndex = getFrameIndex(frames, EMPTY_FRAME)
        if (refIndex === -1) {
            if (!isFull) {
                frames[emptyIndex] = [ref, [1, index]];
            } else {
                let refPointer = getMinValueIndex(frames, 1);
                while (frames[refPointer][1][0] === 1) {
                    frames[refPointer][1][0] = 0;
                    refPointer = (refPointer + 1) % frameCount;
                }
                frames[refPointer] = [ref, [1, index]];
            }
        } else {
            frames[refIndex] = [ref, [1, index]];
        }
    },

    OPT: (frames, ref, index, isFull, frameCount) => {
        const refIndex = getFrameIndex(frames, ref);
        const emptyIndex = getFrameIndex(frames, EMPTY_FRAME)

        if (refIndex === -1) {
            let targetIndex;
            if (emptyIndex !== -1) {
                targetIndex = emptyIndex;
            } else {
                let maxDistance = -1;
                let maxDistanceIndex = 0;
                let minInsertionIndex = Infinity;

                for (let i = 0; i < frames.length; i++) {
                    const [page, [distance, insertionIndex]] = frames[i];
                    if (distance > maxDistance || (distance === maxDistance && insertionIndex < minInsertionIndex)) {
                        maxDistance = distance;
                        maxDistanceIndex = i;
                        minInsertionIndex = insertionIndex;
                    }
                }
                targetIndex = maxDistanceIndex;
            }

            frames[targetIndex] = [ref, [distanceToNextRef(index + 1, ref), index]];
        } else {
            frames[refIndex][1] = [distanceToNextRef(index + 1, ref), frames[refIndex][1][1]];
        }

        for (let i = 0; i < frames.length; i++) {
            if (frames[i][0] !== EMPTY_FRAME) {
                frames[i][1][0] = distanceToNextRef(index + 1, frames[i][0]);
            }
        }
    },
};

const getFrameSubInfo = (algorithmName) => {
    switch (algorithmName) {
        case 'FIFO':
            return '(first-in index)';
        case 'LRU':
            return '(least recent index)';
        case 'MRU':
            return '(most recent index)';
        case 'LFU':
            return '(frequency, first-in index)';
        case 'MFU':
            return '(frequency, first-in index)';
        case '2ND':
            return '(reference bit, first-in index)';
        case 'OPT':
            return '(distance with next string reference item, first-in index)';
        default:
            return '';
    }
};

const visualize = (refs, frameCount, algo) => {
    let pageFaults = 0;
    const currentFrame = initializeFrames(frameCount);
    elements.visualPageFrames.innerHTML = '';
    elements.frameSubInfo.innerHTML = getFrameSubInfo(algo)

    // Initialize table structure
    let tableHTML = '<table class="table-auto border-collapse border border-primary w-full text-center">';
    tableHTML += '<thead><tr><th class="border border-primary">Step</th><th class="border border-primary">Reference</th>';

    for (let i = 0; i < frameCount; i++) {
        tableHTML += `<th class="border border-primary">Frame ${i + 1}</th>`;
    }

    tableHTML += '</tr></thead><tbody>';

    refs.forEach((ref, i) => {
        const isFull = findFrameIndex(currentFrame, (item) => item[0] === '-') === -1;
        const refIndex = findFrameIndex(currentFrame, (item) => item[0] === ref);

        algorithms[algo](currentFrame, ref, i, isFull, frameCount);

        const isPageFault = refIndex === -1;
        if (isPageFault) pageFaults++;

        // Add a row for this reference with order number
        tableHTML += `<tr class="${isPageFault ? '' : 'opacity-50'}">`;
        tableHTML += `<td class="border border-primary">${i + 1}</td>`;  // Reference step
        tableHTML += `<td class="border border-primary font-bold">${ref}</td>`;

        currentFrame.forEach(([data, subData]) => {
            tableHTML += `
                <td class="border border-primary">
                    ${data}
                    <div class="text-info">(${subData})</div>
                </td>`;
        });

        tableHTML += '</tr>';
    });

    tableHTML += '</tbody></table>';
    elements.visualPageFrames.innerHTML = tableHTML;

    // Display summary info
    elements.conclusion.innerHTML = `
        <div>Total references: ${refs.length}</div>
        <div>Page Faults: ${pageFaults}</div>
        <div>Fault Rate: ${Math.round((pageFaults / refs.length) * 100)}%</div>
    `;

    // Optional styling
    elements.frameInfo.className = 'border-solid border border-primary text-center max-w-fit m-auto px-2';
};


const distanceToNextRef = (startIndex, frameNumber) => {
    for (let i = startIndex; i < refStringArray.length; i++) {
        if (refStringArray[i] === frameNumber) return i - startIndex;
    }
    return Infinity;
};

// Event Handlers
const updateVisualization = () => {
    refStringArray = elements.refString.value.split(elements.separator.value);
    frames = parseInt(elements.numOfFrames.value);
    if (elements.algorithm.value !== 'none') {
        visualize(refStringArray, frames, elements.algorithm.value);
    }
};

elements.runBtn.addEventListener('click', updateVisualization);

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

const createEmptyFrame = () => ['-', '-'];

const initializeFrames = (count) => Array(count).fill().map(createEmptyFrame);

const findFrameIndex = (frames, condition) => frames.findIndex(condition);

const getMinValueIndex = (frames, accessor) =>
    findFrameIndex(frames, (item) => item[1][accessor] === Math.min(...frames.map((f) => f[1][accessor])));

const getMaxValueIndex = (frames, accessor) =>
    findFrameIndex(frames, (item) => item[1][accessor] === Math.max(...frames.map((f) => f[1][accessor])));

// Page Replacement Algorithms
const algorithms = {
    FIFO: (prevFrame, ref, index, isFull) => {
        const frame = [...prevFrame];
        const refIndex = findFrameIndex(frame, (item) => item[0] === ref);
        if (refIndex === -1) {
            const targetIndex = isFull
                ? getMinValueIndex(frame, 1)
                : findFrameIndex(frame, (item) => item[0] === '-');
            frame[targetIndex] = [ref, index];
        }
        elements.frameSubInfo.innerHTML = '(first-in index)';
        return frame;
    },

    LRU: (prevFrame, ref, index, isFull) => {
        const frame = [...prevFrame];
        const refIndex = findFrameIndex(frame, (item) => item[0] === ref);
        if (refIndex === -1) {
            const targetIndex = isFull
                ? getMinValueIndex(frame, 1)
                : findFrameIndex(frame, (item) => item[0] === '-');
            frame[targetIndex] = [ref, index];
        } else {
            frame[refIndex][1] = index;
        }
        elements.frameSubInfo.innerHTML = '(least recent index)';
        return frame;
    },

    MRU: (prevFrame, ref, index, isFull) => {
        const frame = [...prevFrame];
        const refIndex = findFrameIndex(frame, (item) => item[0] === ref);
        if (refIndex === -1) {
            const targetIndex = isFull
                ? getMaxValueIndex(frame, 1)
                : findFrameIndex(frame, (item) => item[0] === '-');
            frame[targetIndex] = [ref, index];
        } else {
            frame[refIndex][1] = index;
        }
        elements.frameSubInfo.innerHTML = '(most recent index)';
        return frame;
    },

    LFU: (prevFrame, ref, index, isFull) => {
        const frame = [...prevFrame];
        const refIndex = findFrameIndex(frame, (item) => item[0] === ref);
        if (refIndex === -1) {
            if (!isFull) {
                frame[findFrameIndex(frame, (item) => item[0] === '-')] = [ref, [1, index]];
            } else {
                const leastFrequent = frame.filter((item) => item[1][0] === Math.min(...frame.map((f) => f[1][0])));
                const victim = leastFrequent.find((item) => item[1][1] === Math.min(...leastFrequent.map((f) => f[1][1])));
                frame[findFrameIndex(frame, (item) => item[0] === victim[0])] = [ref, [1, index]];
            }
        } else {
            frame[refIndex][1][0]++;
        }
        elements.frameSubInfo.innerHTML = '(frequency, first-in index)';
        return frame;
    },

    MFU: (prevFrame, ref, index, isFull) => {
        const frame = [...prevFrame];
        const refIndex = findFrameIndex(frame, (item) => item[0] === ref);
        if (refIndex === -1) {
            if (!isFull) {
                frame[findFrameIndex(frame, (item) => item[0] === '-')] = [ref, [1, index]];
            } else {
                const mostFrequent = frame.filter((item) => item[1][0] === Math.max(...frame.map((f) => f[1][0])));
                const victim = mostFrequent.find((item) => item[1][1] === Math.min(...mostFrequent.map((f) => f[1][1])));
                frame[findFrameIndex(frame, (item) => item[0] === victim[0])] = [ref, [1, index]];
            }
        } else {
            frame[refIndex][1][0]++;
        }
        elements.frameSubInfo.innerHTML = '(frequency, first-in index)';
        return frame;
    },

    '2ND': (prevFrame, ref, index, isFull, frameCount) => {
        const frame = [...prevFrame];
        const refIndex = findFrameIndex(frame, (item) => item[0] === ref);
        if (refIndex === -1) {
            if (!isFull) {
                frame[findFrameIndex(frame, (item) => item[0] === '-')] = [ref, [1, index]];
            } else {
                let refPointer = getMinValueIndex(frame, 1);
                while (frame[refPointer][1][0] === 1) {
                    frame[refPointer][1][0] = 0;
                    refPointer = (refPointer + 1) % frameCount;
                }
                frame[refPointer] = [ref, [1, index]];
            }
        } else {
            frame[refIndex] = [ref, [1, index]];
        }
        elements.frameSubInfo.innerHTML = '(reference bit, first-in index)';
        return frame;
    },

    OPT: (prevFrame, ref, index, isFull) => {
        const frame = prevFrame.map((item) => item[1][0] === '∞' ? [item[0], [Infinity, item[1][1]]] : item);
        const refIndex = findFrameIndex(frame, (item) => item[0] === ref);
        if (refIndex === -1) {
            if (!isFull) {
                frame[findFrameIndex(frame, (item) => item[0] === '-')] = [ref, [0, index]];
            } else {
                const longestDistance = frame.filter((item) => item[1][0] === Math.max(...frame.map((f) => f[1][0])));
                const victim = longestDistance.find((item) => item[1][1] === Math.min(...longestDistance.map((f) => f[1][1])));
                frame[findFrameIndex(frame, (item) => item[0] === victim[0])] = [ref, [0, index]];
            }
        }
        for (let j = 0; j < frame.length; j++) {
            if (frame[j][0] !== '-') {
                frame[j][1][0] = distanceToNextRef(index + 1, frame[j][0]) === Infinity ? '∞' : distanceToNextRef(index + 1, frame[j][0]);
            }
        }
        elements.frameSubInfo.innerHTML = '(distance with next string reference item, first-in index)';
        return frame;
    },
};

const visualize = (refs, frameCount, algo) => {
    let pageFaults = 0;
    let currentFrame = initializeFrames(frameCount);
    elements.visualPageFrames.innerHTML = '';

    // Initialize table structure
    let tableHTML = '<table class="table-auto border-collapse border border-primary w-full text-center">';
    tableHTML += '<thead><tr><th class="border border-primary">Step</th><th class="border border-primary">Reference</th>';

    for (let i = 0; i < frameCount; i++) {
        tableHTML += `<th class="border border-primary">Frame ${i + 1}</th>`;
    }

    tableHTML += '</tr></thead><tbody>';

    refs.forEach((ref, i) => {
        const isFull = findFrameIndex(currentFrame, (item) => item[0] === '-') === -1;
        const prevFrame = [...currentFrame];
        const refIndex = findFrameIndex(prevFrame, (item) => item[0] === ref);

        currentFrame = algorithms[algo](prevFrame, ref, i, isFull, frameCount);

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

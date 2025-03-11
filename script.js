let chart=null;
let xPieChart=null;
let yPieChart=null;
let csvData=[];
const csvUrl='https://raw.githubusercontent.com/gyvhj/analytics-dashboard/main/data-to-visualize/Electric_Vehicle_Population_Data.csv';


document.addEventListener('DOMContentLoaded', function() {
Papa.parse(csvUrl, {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: function(results) {
csvData=results.data.filter(item=> 
item['Electric Range'] > 0 && 
!isNaN(item['Electric Range'])
);
populateDropdowns(results.meta.fields);

const xSelect=document.getElementById('parameter1');
const ySelect=document.getElementById('parameter2');

xSelect.value='Electric Range';
ySelect.value='Model Year';

if (csvData.length > 0) {
    updateChart();
} else {
    alert("No valid EV data found in the CSV file.");
}
}
    });
});


function populateDropdowns(headers) {
    const xSelect=document.getElementById('parameter1');
    const ySelect=document.getElementById('parameter2');
    
    xSelect.innerHTML=ySelect.innerHTML='';
    
    const numericColumns=headers.filter(header=> 
        csvData.some(row=> typeof row[header]==='number')
    );

    numericColumns.forEach(column=> {
        xSelect.add(new Option(column));
        ySelect.add(new Option(column));
    });
}

function calculateStats(values) {
if(values.length===0) return {};
const sum=values.reduce((a, b)=> a + b, 0);
const mean=sum / values.length;
const variance=values.reduce((a, b)=> a + (b - mean) ** 2, 0) / values.length;

return {
    min: Math.min(...values),
        max: Math.max(...values),
        mean: mean,
        std: Math.sqrt(variance),
        count: values.length
    };
}

function updateStatsTable(xValues, yValues) {
    const xStats=calculateStats(xValues);
    const yStats=calculateStats(yValues);

    document.getElementById('xStatHeader').textContent=
        document.getElementById('parameter1').value;
    document.getElementById('yStatHeader').textContent=
        document.getElementById('parameter2').value;

    document.getElementById('xMin').textContent=
    xStats.min?.toLocaleString(undefined, {maximumFractionDigits: 2}) || '-';
document.getElementById('xMax').textContent=
    xStats.max?.toLocaleString(undefined, {maximumFractionDigits: 2}) || '-';
document.getElementById('xMean').textContent=
    xStats.mean?.toLocaleString(undefined, {maximumFractionDigits: 2}) || '-';
document.getElementById('xStd').textContent=
    xStats.std?.toLocaleString(undefined, {maximumFractionDigits: 2}) || '-';

document.getElementById('yMin').textContent=
    yStats.min?.toLocaleString(undefined, {maximumFractionDigits: 2}) || '-';
    document.getElementById('yMax').textContent=
        yStats.max?.toLocaleString(undefined, {maximumFractionDigits: 2}) || '-';
    document.getElementById('yMean').textContent=
        yStats.mean?.toLocaleString(undefined, {maximumFractionDigits: 2}) || '-';
    document.getElementById('yStd').textContent=
        yStats.std?.toLocaleString(undefined, {maximumFractionDigits: 2}) || '-';

    document.getElementById('dataCount').textContent=
        xStats.count?.toLocaleString() || '0';
}

function createBinnedData(values, label) {
if (!values || values.length===0) {
    alert(`Cannot generate pie chart for ${label}: No data available.`); 
    return { labels: [], data: [], title: `${label} Distribution` };
}

    const min=Math.min(...values);
    const max=Math.max(...values);
    const binCount=5;
    const binSize=(max - min) / binCount;

    const bins=Array.from({ length: binCount }, (_, i)=> ({
        label: `${(min + i * binSize).toFixed(0)}-${(min + (i + 1) * binSize).toFixed(0)}`,
        count: 0
    }));

    values.forEach(value=> {
        const binIndex=Math.min(Math.floor((value - min) / binSize), binCount - 1);
        bins[binIndex].count++;
    });

return {
    labels: bins.map(b=> b.label),
    data: bins.map(b=> b.count),
    title: `${label} Distribution`
};
}

function calculateCorrelation(xValues, yValues) {
    const n=xValues.length;
    const sumX=xValues.reduce((a, b)=> a + b, 0);
    const sumY=yValues.reduce((a, b)=> a + b, 0);
    const sumXY=xValues.reduce((a, x, i)=> a + x * yValues[i], 0);
    const sumX2=xValues.reduce((a, b)=> a + b * b, 0);
    const sumY2=yValues.reduce((a, b)=> a + b * b, 0);
    
    const numerator=n * sumXY - sumX * sumY;
    const denominator=Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator===0 ? 0 : numerator / denominator;
}

function interpretCorrelation(r) {
    const absR=Math.abs(r);
    if (absR >=0.8) return "Very Strong";
    if (absR >=0.6) return "Strong";
    if (absR >=0.4) return "Moderate";
    if (absR >=0.2) return "Weak";
    return "Very Weak";
}

function updateChart() {
        const xValue=document.getElementById('parameter1').value;
        const yValue=document.getElementById('parameter2').value;

const chartData=csvData.map(row=> ({
    x: row[xValue],
    y: row[yValue],
    model: row['Model'],
    make: row['Make']
})).filter(point=> !isNaN(point.x) && !isNaN(point.y));

const xValues=chartData.map(d=> d.x);
const yValues=chartData.map(d=> d.y);

updateStatsTable(xValues, yValues);

const xBinned=createBinnedData(xValues, xValue);
const yBinned=createBinnedData(yValues, yValue);


if (chart) chart.destroy();
if (xPieChart) xPieChart.destroy();
if (yPieChart) yPieChart.destroy();
if(xBinned.labels.length===0 || yBinned.labels.length===0){
    alert("Cannot generate pie chart");
}

const ctx=document.getElementById('dataChart').getContext('2d');
chart=new Chart(ctx, {
    type: 'scatter',
    data: {
        datasets: [{
            label: `${xValue} vs ${yValue}`,
    data: chartData,
    backgroundColor: 'rgba(52, 152, 219, 0.7)',
    borderColor: 'rgba(52, 152, 219, 1)',
    pointRadius: 4,
    hoverRadius: 6
}]
},
options: {
scales: {
    x: {
        title: {
            display: true,
            text: xValue,
            font: {
                weight: 'bold'
        }
    }
},
    y: {
        title: {
            display: true,
            text: yValue,
                font: {
                        weight: 'bold'
                    }
            }
}
},
    plugins: {
            tooltip: {
                callbacks: {
                    label: (ctx)=> [
            `Make: ${ctx.raw.make}`,
                `Model: ${ctx.raw.model}`,
                `${xValue}: ${ctx.parsed.x}`,
                `${yValue}: ${ctx.parsed.y}`
            ].join('\n')
            }
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });

        const xPieCtx=document.getElementById('xPieChart').getContext('2d');
        xPieChart=new Chart(xPieCtx, {
            type: 'pie',
            data: {
                labels: xBinned.labels,
                datasets: [{
                    label: xBinned.title,
    data: xBinned.data,
    backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)'
    ],
    borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)'
    ],
    borderWidth: 1
}]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: xBinned.title
                    }
                }
            }
        });

        const yPieCtx=document.getElementById('yPieChart').getContext('2d');
        yPieChart=new Chart(yPieCtx, {
            type: 'pie',
            data: {
                labels: yBinned.labels,
                datasets: [{
                    label: yBinned.title,
                    data: yBinned.data,
                    backgroundColor: [
                        'rgba(255, 159, 64, 0.8)',
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)'
                    ],
                    borderColor: [
                        'rgba(255, 159, 64, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: yBinned.title
                    }
                }
            }
        });
}
let monthlyMarks = {};
let subjectData = {};

let months = ["Jan","Feb","Mar","Apr","May","Jun",
              "Jul","Aug","Sep","Oct","Nov","Dec"];

function addMarks() {
    let month = document.getElementById("marksMonth").value;
    let subject = document.getElementById("subject").value;
    let marks = parseFloat(document.getElementById("marksValue").value);

    if (!marks || marks <= 0 || marks > 100) {
        alert("Enter valid marks (1-100)");
        return;
    }

    monthlyMarks[month] = (monthlyMarks[month] || 0) + marks;
    subjectData[subject] = (subjectData[subject] || 0) + marks;

    updateCharts();
}

function updateCharts() {

    let marksData = months.map(m => monthlyMarks[m] || 0);

    let totalMarks = marksData.reduce((a,b)=>a+b,0);
    let totalEntries = Object.values(monthlyMarks).length;
    let average = totalEntries ? (totalMarks / totalEntries).toFixed(2) : 0;

    document.getElementById("averageText").innerText =
        "Average Marks: " + average;

    if (window.lineChartInstance) window.lineChartInstance.destroy();
    if (window.barChartInstance) window.barChartInstance.destroy();
    if (window.pieChartInstance) window.pieChartInstance.destroy();

    window.lineChartInstance = new Chart(document.getElementById("lineChart"), {
        type: "line",
        data: {
            labels: months,
            datasets: [{
                label: "Marks",
                data: marksData,
                borderColor: "blue",
                fill: false
            }]
        }
    });

    window.barChartInstance = new Chart(document.getElementById("barChart"), {
        type: "bar",
        data: {
            labels: months,
            datasets: [{
                label: "Marks",
                data: marksData
            }]
        }
    });

    window.pieChartInstance = new Chart(document.getElementById("pieChart"), {
        type: "pie",
        data: {
            labels: Object.keys(subjectData),
            datasets: [{
                data: Object.values(subjectData)
            }]
        }
    });
}

updateCharts();
// Utils for exporting, sharing and printing PDFs
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateShoppingListPDF = (shoppingList: any[]) => {
    const doc = new jsPDF();
    
    // Título principal
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Mi Lista de la Compra", 14, 20);

    // Subtítulo
    doc.setFontSize(12);
    doc.setTextColor(150, 150, 150);
    doc.text("ChefCommunity - Plan Semanal", 14, 28);

    // Tabla
    const columnas = ["Ingrediente", "Cantidad Necesaria"];
    const filas = shoppingList.map((item: any) => [item.name, item.quantity]);

    autoTable(doc, {
        startY: 35,
        head: [columnas],
        body: filas,
        theme: 'grid',
        headStyles: { fillColor: [217, 93, 0] }, // primary orange color
    });

    doc.save("Lista_de_Compra_ChefCo2.pdf");
};

export const generateRecipePDF = (recipe: any) => {
    const doc = new jsPDF();
    
    // Configuración inicial
    const margin = 14;
    let currentY = 20;

    // Título de la Receta
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(recipe.title || "Receta", margin, currentY);
    currentY += 8;

    // Autor y Tiempo
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Por: ${recipe.author || "Chef Anónimo"} | Tiempo: ${recipe.prep_time || "--"} min`, margin, currentY);
    currentY += 12;

    // Sección: Ingredientes
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(217, 93, 0); // Color primario naranja
    doc.text("Ingredientes", margin, currentY);
    currentY += 5;

    const ingredients = recipe.ingredients || [];
    const ingColumnas = ["Ingrediente", "Cantidad"];
    const ingFilas = ingredients.map((ri: any) => {
        // Manejar diferentes estructuras de ingredientes
        const name = ri.ingredient?.name || ri.name || "Ingrediente";
        const quantity = ri.quantity || "";
        const unit = ri.ingredient?.unit || ri.unit || "";
        return [name, `${quantity} ${unit}`.trim()];
    });

    autoTable(doc, {
        startY: currentY,
        head: [ingColumnas],
        body: ingFilas,
        theme: 'striped',
        headStyles: { fillColor: [217, 93, 0] },
        margin: { left: margin },
    });

    // Actualizar Y después de la tabla
    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Sección: Preparación
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(217, 93, 0);
    doc.text("Preparación", margin, currentY);
    currentY += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);

    const instructions = recipe.instructions;
    if (typeof instructions === 'string') {
        const lines = instructions.split('\n').filter((l: string) => l.trim() !== '');
        lines.forEach((line: string, index: number) => {
            const stepText = `${index + 1}. ${line.trim()}`;
            const splitText = doc.splitTextToSize(stepText, 180);
            
            // Verificar si necesitamos nueva página
            if (currentY + (splitText.length * 5) > 280) {
                doc.addPage();
                currentY = 20;
            }
            
            doc.text(splitText, margin, currentY);
            currentY += (splitText.length * 7);
        });
    } else if (Array.isArray(instructions)) {
        instructions.forEach((step: any, index: number) => {
            const stepTitle = step.title ? `${index + 1}. ${step.title}` : `Paso ${index + 1}`;
            const stepBody = step.text || "";
            
            doc.setFont("helvetica", "bold");
            doc.text(stepTitle, margin, currentY);
            currentY += 6;
            
            doc.setFont("helvetica", "normal");
            const splitBody = doc.splitTextToSize(stepBody, 180);
            
            if (currentY + (splitBody.length * 5) > 280) {
                doc.addPage();
                currentY = 20;
            }
            
            doc.text(splitBody, margin, currentY);
            currentY += (splitBody.length * 7);
        });
    } else {
        doc.text("No hay instrucciones disponibles.", margin, currentY);
    }

    doc.save(`Receta_${(recipe.title || 'ChefCo2').replace(/\s+/g, '_')}.pdf`);
};

export const shareContent = (title: string, url: string) => {
    if (navigator.share) {
        navigator.share({ title: title, url: url }).catch(console.error);
    } else {
        navigator.clipboard.writeText(url);
        alert("Enlace copiado al portapapeles");
    }
};

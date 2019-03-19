﻿namespace WebClashServer.Editors
{
    partial class QuestObjectiveProperties
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(QuestObjectiveProperties));
            this.label1 = new System.Windows.Forms.Label();
            this.objectiveType = new System.Windows.Forms.ComboBox();
            this.groupBox1 = new System.Windows.Forms.GroupBox();
            this.killObjectivePanel = new System.Windows.Forms.Panel();
            this.label2 = new System.Windows.Forms.Label();
            this.killNpcSelection = new System.Windows.Forms.ComboBox();
            this.label3 = new System.Windows.Forms.Label();
            this.killNpcAmount = new System.Windows.Forms.NumericUpDown();
            this.groupBox1.SuspendLayout();
            this.killObjectivePanel.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.killNpcAmount)).BeginInit();
            this.SuspendLayout();
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Location = new System.Drawing.Point(36, 15);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(79, 13);
            this.label1.TabIndex = 0;
            this.label1.Text = "Objective Type";
            // 
            // objectiveType
            // 
            this.objectiveType.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.objectiveType.FormattingEnabled = true;
            this.objectiveType.Location = new System.Drawing.Point(121, 12);
            this.objectiveType.Name = "objectiveType";
            this.objectiveType.Size = new System.Drawing.Size(111, 21);
            this.objectiveType.TabIndex = 1;
            this.objectiveType.SelectedIndexChanged += new System.EventHandler(this.objectiveType_SelectedIndexChanged);
            // 
            // groupBox1
            // 
            this.groupBox1.Controls.Add(this.killObjectivePanel);
            this.groupBox1.Location = new System.Drawing.Point(12, 39);
            this.groupBox1.Name = "groupBox1";
            this.groupBox1.Size = new System.Drawing.Size(265, 161);
            this.groupBox1.TabIndex = 2;
            this.groupBox1.TabStop = false;
            this.groupBox1.Text = "Properties";
            // 
            // killObjectivePanel
            // 
            this.killObjectivePanel.Controls.Add(this.killNpcAmount);
            this.killObjectivePanel.Controls.Add(this.label3);
            this.killObjectivePanel.Controls.Add(this.killNpcSelection);
            this.killObjectivePanel.Controls.Add(this.label2);
            this.killObjectivePanel.Location = new System.Drawing.Point(6, 19);
            this.killObjectivePanel.Name = "killObjectivePanel";
            this.killObjectivePanel.Size = new System.Drawing.Size(253, 136);
            this.killObjectivePanel.TabIndex = 0;
            this.killObjectivePanel.Visible = false;
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Location = new System.Drawing.Point(18, 19);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(29, 13);
            this.label2.TabIndex = 0;
            this.label2.Text = "NPC";
            // 
            // killNpcSelection
            // 
            this.killNpcSelection.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.killNpcSelection.FormattingEnabled = true;
            this.killNpcSelection.Location = new System.Drawing.Point(113, 16);
            this.killNpcSelection.Name = "killNpcSelection";
            this.killNpcSelection.Size = new System.Drawing.Size(121, 21);
            this.killNpcSelection.TabIndex = 1;
            this.killNpcSelection.SelectedIndexChanged += new System.EventHandler(this.killNpcSelection_SelectedIndexChanged);
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Location = new System.Drawing.Point(18, 56);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(43, 13);
            this.label3.TabIndex = 2;
            this.label3.Text = "Amount";
            // 
            // killNpcAmount
            // 
            this.killNpcAmount.Location = new System.Drawing.Point(114, 54);
            this.killNpcAmount.Maximum = new decimal(new int[] {
            1215752191,
            23,
            0,
            0});
            this.killNpcAmount.Minimum = new decimal(new int[] {
            1,
            0,
            0,
            0});
            this.killNpcAmount.Name = "killNpcAmount";
            this.killNpcAmount.Size = new System.Drawing.Size(120, 20);
            this.killNpcAmount.TabIndex = 3;
            this.killNpcAmount.TextAlign = System.Windows.Forms.HorizontalAlignment.Center;
            this.killNpcAmount.Value = new decimal(new int[] {
            1,
            0,
            0,
            0});
            this.killNpcAmount.ValueChanged += new System.EventHandler(this.killNpcAmount_ValueChanged);
            // 
            // QuestObjectiveProperties
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(290, 212);
            this.Controls.Add(this.groupBox1);
            this.Controls.Add(this.objectiveType);
            this.Controls.Add(this.label1);
            this.Icon = ((System.Drawing.Icon)(resources.GetObject("$this.Icon")));
            this.MaximizeBox = false;
            this.MaximumSize = new System.Drawing.Size(306, 251);
            this.MinimumSize = new System.Drawing.Size(306, 251);
            this.Name = "QuestObjectiveProperties";
            this.Text = "WebClash Server - Quest Objective";
            this.Load += new System.EventHandler(this.QuestObjectiveProperties_Load);
            this.groupBox1.ResumeLayout(false);
            this.killObjectivePanel.ResumeLayout(false);
            this.killObjectivePanel.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.killNpcAmount)).EndInit();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.ComboBox objectiveType;
        private System.Windows.Forms.GroupBox groupBox1;
        private System.Windows.Forms.Panel killObjectivePanel;
        private System.Windows.Forms.ComboBox killNpcSelection;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.NumericUpDown killNpcAmount;
        private System.Windows.Forms.Label label3;
    }
}